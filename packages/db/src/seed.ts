/**
 * Seeds 3 demo tenants so a fake hostname renders a real page from its
 * config row. This is the Week 1 acceptance test and the basis of the
 * internal theme gallery + the per-service/per-city page generation.
 *
 *   pnpm --filter @platform/db seed
 *
 * Idempotent: re-running upserts the demo tenants/domains/configs in
 * place (keyed on the unique slug / hostname / (tenant,state) indexes),
 * so it is safe to re-run after schema or content changes.
 *
 * Resolvable locally at:
 *   demo-roofing.localhost:3000
 *   demo-dental.localhost:3000
 *   demo-bistro.localhost:3000
 * Generated pages, e.g.:
 *   demo-roofing.localhost:3000/areas/clearwater
 *   demo-roofing.localhost:3000/roofer-repair/st-petersburg
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tenants, domains, siteConfigs } from "./schema";
import type { SiteTokens, SitePage, ServiceArea } from "./types";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");

const sqlClient = postgres(url, { max: 1 });
const db = drizzle(sqlClient);

// Local slug helper (mirrors slugify in @platform/blocks; duplicated so
// the db package stays dependency-light and doesn't import blocks).
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// -- Three deliberately different token sets ---------------------------
const ROOFING_TOKENS: SiteTokens = {
  colors: {
    brand: "#1F3A5F",
    accent: "#E8A33D",
    ink: "#16202B",
    surface: "#FFFFFF",
    muted: "#5C6B7A",
  },
  fontPair: "archivo-inter",
  radius: "sharp",
  buttonStyle: "solid",
  density: "comfortable",
};

const DENTAL_TOKENS: SiteTokens = {
  colors: {
    brand: "#0E8C8C",
    accent: "#7FD1C4",
    ink: "#1A2E2E",
    surface: "#F7FBFB",
    muted: "#6B8585",
  },
  fontPair: "fraunces-nunito",
  radius: "pill",
  buttonStyle: "soft",
  density: "spacious",
};

const BISTRO_TOKENS: SiteTokens = {
  colors: {
    brand: "#7A2E2E",
    accent: "#D9A441",
    ink: "#2B1A12",
    surface: "#FBF6EE",
    muted: "#8A6F5C",
  },
  fontPair: "playfair-source",
  radius: "soft",
  buttonStyle: "outline",
  density: "comfortable",
};

function homePage(
  business: string,
  service: string,
  city: string,
  state: string,
  areas: ServiceArea[]
): SitePage[] {
  const areaLinks = areas.map((a) => ({
    label: a.city,
    href: `/areas/${slug(a.city)}`,
  }));
  return [
    {
      path: "/",
      title: `${business} - ${service} in ${city}`,
      meta: {
        description: `${business} provides trusted ${service.toLowerCase()} in ${city}. Call for a free quote.`,
        keywords: [`${service} ${city}`, `${service} near me`],
      },
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          variant: "image-right",
          props: {
            heading: `${service} in ${city} you can rely on`,
            sub: `Licensed, insured, and trusted by your neighbors.`,
            ctaLabel: "Get a free quote",
          },
        },
        {
          id: "services-1",
          type: "services",
          variant: "cards",
          props: { heading: "What we do" },
        },
        {
          id: "testimonials-1",
          type: "testimonials",
          variant: "carousel",
          props: { heading: "What customers say" },
        },
        {
          id: "area-1",
          type: "service-area",
          variant: "city-list",
          props: { heading: `Areas we serve in ${state}`, areaLinks },
        },
        {
          id: "cta-1",
          type: "cta-band",
          variant: "default",
          props: { heading: "Ready to start?", ctaLabel: "Call now" },
        },
        {
          id: "contact-1",
          type: "contact-form",
          variant: "split",
          props: { heading: "Request a quote" },
        },
        {
          id: "footer-1",
          type: "footer",
          variant: "default",
          props: {},
        },
      ],
    },
  ];
}

async function main() {
  console.log("Seeding demo tenants (idempotent upsert)...");

  const demos = [
    {
      slug: "demo-roofing",
      businessName: "Summit Roofing Co.",
      niche: "Roofers",
      city: "Tampa",
      state: "FL",
      tokens: ROOFING_TOKENS,
      serviceAreas: [
        { city: "Tampa", state: "FL" },
        { city: "St. Petersburg", state: "FL" },
        { city: "Clearwater", state: "FL" },
        { city: "Brandon", state: "FL" },
      ] as ServiceArea[],
    },
    {
      slug: "demo-dental",
      businessName: "Bright Smile Dental",
      niche: "Dentists",
      city: "Raleigh",
      state: "NC",
      tokens: DENTAL_TOKENS,
      serviceAreas: [
        { city: "Raleigh", state: "NC" },
        { city: "Durham", state: "NC" },
        { city: "Cary", state: "NC" },
        { city: "Chapel Hill", state: "NC" },
      ] as ServiceArea[],
    },
    {
      slug: "demo-bistro",
      businessName: "Olive & Ember",
      niche: "Restaurants",
      city: "Austin",
      state: "TX",
      tokens: BISTRO_TOKENS,
      serviceAreas: [
        { city: "Austin", state: "TX" },
        { city: "Round Rock", state: "TX" },
        { city: "Cedar Park", state: "TX" },
      ] as ServiceArea[],
    },
  ];

  const serviceLabel: Record<string, string> = {
    Roofers: "Roofing",
    Dentists: "Dental Care",
    Restaurants: "Dining",
  };

  for (const d of demos) {
    const pages = homePage(
      d.businessName,
      serviceLabel[d.niche] ?? d.niche,
      d.city,
      d.state,
      d.serviceAreas
    );

    const [tenant] = await db
      .insert(tenants)
      .values({
        slug: d.slug,
        businessName: d.businessName,
        niche: d.niche,
        city: d.city,
        state: d.state,
        status: "live",
        plan: "growth",
        serviceAreas: d.serviceAreas,
      })
      .onConflictDoUpdate({
        target: tenants.slug,
        set: {
          businessName: d.businessName,
          niche: d.niche,
          city: d.city,
          state: d.state,
          status: "live",
          plan: "growth",
          serviceAreas: d.serviceAreas,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!tenant) throw new Error(`failed to upsert tenant ${d.slug}`);

    await db
      .insert(domains)
      .values({
        tenantId: tenant.id,
        hostname: `${d.slug}.localhost:3000`,
        isPrimary: true,
        sslStatus: "active",
      })
      .onConflictDoUpdate({
        target: domains.hostname,
        set: { tenantId: tenant.id, isPrimary: true, sslStatus: "active" },
      });

    // draft + published configs (identical at seed time)
    for (const state of ["draft", "published"] as const) {
      await db
        .insert(siteConfigs)
        .values({
          tenantId: tenant.id,
          state,
          tokens: d.tokens,
          pages,
          customCss: "",
          featureFlags: {},
          version: 1,
          publishedAt: state === "published" ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [siteConfigs.tenantId, siteConfigs.state],
          set: {
            tokens: d.tokens,
            pages,
            customCss: "",
            featureFlags: {},
            version: 1,
            publishedAt: state === "published" ? new Date() : null,
            updatedAt: new Date(),
          },
        });
    }

    console.log(`  ok ${d.businessName} -> ${d.slug}.localhost:3000`);
  }

  console.log("Done. Start the sites app and visit any host above.");
  await sqlClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
