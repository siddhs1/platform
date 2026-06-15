import "server-only";
import { db, schema, presetTokens } from "@platform/db";
import { and, eq } from "drizzle-orm";
import type { SitePage } from "@platform/db";
import { clerkEnabled } from "./clerk";

/**
 * Operator onboarding (C1): create a client tenant from an intake form.
 *
 * Steps the wizard composes: exclusivity check (one client per niche+city+
 * state, enforced by the unique index), create the tenant + seed a draft and
 * published site_config from a theme preset + a starter page, then best-effort
 * create a Clerk org + invite the client. Domain provisioning (C2) is handled
 * separately. Operator-only; the caller already holds an operator session.
 */

export const NICHE_OPTIONS = [
  "Roofers",
  "HVAC",
  "Plumbers",
  "Electricians",
  "Landscapers",
  "Restoration",
  "Dentists",
  "Lawyers",
  "Chiropractors",
  "Med Spas",
  "Restaurants",
  "Salons",
  "Auto Repair",
  "Other",
] as const;

export const PLAN_OPTIONS = ["basic", "growth", "scale"] as const;
export type PlanTier = (typeof PLAN_OPTIONS)[number];

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SERVICE_LABEL: Record<string, string> = {
  Roofers: "Roofing",
  HVAC: "Heating & Cooling",
  Plumbers: "Plumbing",
  Electricians: "Electrical",
  Landscapers: "Landscaping",
  Restoration: "Restoration",
  Dentists: "Dental Care",
  Lawyers: "Legal Services",
  Chiropractors: "Chiropractic Care",
  "Med Spas": "Med Spa Services",
  Restaurants: "Dining",
  Salons: "Salon Services",
  "Auto Repair": "Auto Repair",
};

function serviceLabel(niche: string): string {
  return SERVICE_LABEL[niche] ?? niche;
}

/** A starter home page. Blocks self-populate from the business context
 *  (niche/city) so the fresh site looks authored before a VA adds copy. */
function starterPages(business: string, niche: string, city: string, state: string): SitePage[] {
  const service = serviceLabel(niche);
  return [
    {
      path: "/",
      title: `${business} - ${service} in ${city}`,
      meta: {
        description: `${business} provides trusted ${service.toLowerCase()} in ${city}, ${state}. Call for a free quote.`,
        keywords: [`${service} ${city}`, `${service} near me`],
      },
      blocks: [
        { id: "hero-1", type: "hero", variant: "image-right", props: { heading: `${service} in ${city} you can rely on`, sub: "Licensed, insured, and trusted by your neighbors.", ctaLabel: "Get a free quote" } },
        { id: "trust-1", type: "trust-bar", variant: "stats", props: {} },
        { id: "services-1", type: "services", variant: "cards", props: { heading: "What we do" } },
        { id: "whyus-1", type: "why-us", variant: "icon-grid", props: {} },
        { id: "reviews-1", type: "reviews-feed", variant: "cards", props: {} },
        { id: "faq-1", type: "faq", variant: "accordion", props: {} },
        { id: "cta-1", type: "cta-band", variant: "default", props: { heading: "Ready to start?", ctaLabel: "Call now" } },
      ],
    },
  ];
}

export interface ExclusivityConflict {
  businessName: string;
  status: string;
}

/** One client per (niche, city, state). Returns the conflicting tenant, if any. */
export async function checkExclusivity(
  niche: string,
  city: string,
  state: string
): Promise<ExclusivityConflict | null> {
  const rows = await db
    .select({
      businessName: schema.tenants.businessName,
      status: schema.tenants.status,
    })
    .from(schema.tenants)
    .where(
      and(
        eq(schema.tenants.niche, niche),
        eq(schema.tenants.city, city),
        eq(schema.tenants.state, state)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function slugTaken(slug: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, slug))
    .limit(1);
  return rows.length > 0;
}

export interface CreateTenantInput {
  businessName: string;
  slug: string;
  niche: string;
  city: string;
  state: string;
  plan: PlanTier;
  presetId: string;
}

/** Insert the tenant + seed draft & published configs. Returns the tenant id.
 *  Throws on a unique-index conflict (niche/city/state or slug). */
export async function createTenant(input: CreateTenantInput): Promise<string> {
  const tokens = presetTokens(input.presetId);
  const pages = starterPages(input.businessName, input.niche, input.city, input.state);

  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: input.slug,
      businessName: input.businessName,
      niche: input.niche,
      city: input.city,
      state: input.state,
      status: "onboarding",
      plan: input.plan,
    })
    .returning({ id: schema.tenants.id });
  if (!tenant) throw new Error("tenant insert returned no row");

  const now = new Date();
  for (const state of ["draft", "published"] as const) {
    await db.insert(schema.siteConfigs).values({
      tenantId: tenant.id,
      state,
      tokens,
      pages,
      customCss: "",
      featureFlags: {},
      version: 1,
      publishedAt: state === "published" ? now : null,
    });
  }
  return tenant.id;
}

export interface ProvisionResult {
  orgId: string | null;
  invited: boolean;
}

/** Best-effort: create a Clerk org for the tenant, link it, and invite the
 *  client (also writing a memberships row as the source of truth). Degrades to
 *  a no-op without Clerk keys; never throws. */
export async function provisionClerkOrg(
  tenantId: string,
  businessName: string,
  operatorUserId: string,
  clientEmail: string | null
): Promise<ProvisionResult> {
  if (!clerkEnabled) return { orgId: null, invited: false };
  try {
    const mod = await import("@clerk/nextjs/server");
    const client = await mod.clerkClient();
    const orgs = client.organizations as unknown as {
      createOrganization: (p: { name: string; createdBy: string }) => Promise<{ id: string }>;
      createOrganizationInvitation: (p: {
        organizationId: string;
        emailAddress: string;
        role: string;
        inviterUserId?: string;
      }) => Promise<unknown>;
    };
    const org = await orgs.createOrganization({
      name: businessName,
      createdBy: operatorUserId,
    });
    await db
      .update(schema.tenants)
      .set({ clerkOrgId: org.id, updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenantId));

    let invited = false;
    if (clientEmail) {
      await db
        .insert(schema.memberships)
        .values({
          tenantId,
          email: clientEmail,
          role: "client_admin",
          status: "invited",
        })
        .onConflictDoUpdate({
          target: [schema.memberships.tenantId, schema.memberships.email],
          set: { role: "client_admin" },
        });
      try {
        await orgs.createOrganizationInvitation({
          organizationId: org.id,
          emailAddress: clientEmail,
          role: "org:admin",
          inviterUserId: operatorUserId,
        });
        invited = true;
      } catch {
        invited = false;
      }
    }
    return { orgId: org.id, invited };
  } catch {
    return { orgId: null, invited: false };
  }
}
