import "server-only";
import { redirect } from "next/navigation";
import { db, schema } from "@platform/db";
import { and, eq } from "drizzle-orm";
import { clerkEnabled, devNoAuth, type Role } from "./clerk";
import type { TenantRow } from "./queries";

/**
 * The signed-in client's portal context: their single tenant + role.
 *
 * Clients never switch tenants. The tenant is derived from the user's active
 * Clerk organization (tenants.clerk_org_id, one org per tenant) and the role
 * from their membership row. All portal queries scope to ctx.tenant.id; there
 * is no URL-supplied tenant id in the portal, so there is no id-spoofing
 * surface to guard.
 */
export interface PortalContext {
  userId: string;
  email: string | null;
  name: string | null;
  role: Role;
  tenant: TenantRow;
}

/**
 * Resolve the portal context, or null when the visitor is not a client of any
 * tenant.
 *
 * Dev bypass (CONSOLE_DEV_NO_AUTH=1, non-production only): binds to a tenant by
 * slug (CONSOLE_DEV_PORTAL_SLUG, else the oldest tenant) as client_admin, so
 * the portal is buildable and testable before Clerk + invitations exist. This
 * mirrors the operator console's dev-owner session.
 */
export async function getPortalContext(): Promise<PortalContext | null> {
  if (clerkEnabled) {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const a = await auth();
    if (!a.userId) return null;
    // A client acts within their tenant's org; without an active org we
    // cannot resolve a single tenant, so treat as no portal access.
    if (!a.orgId) return null;
    const tenant = await findTenantByOrg(a.orgId);
    if (!tenant) return null;

    const user = await currentUser().catch(() => null);
    const name =
      user && (user.firstName || user.lastName)
        ? [user.firstName, user.lastName].filter(Boolean).join(" ")
        : null;

    return {
      userId: a.userId,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      name,
      role: await roleForUser(tenant.id, a.userId),
      tenant,
    };
  }

  if (devNoAuth) {
    const tenant = await devTenant();
    if (!tenant) return null;
    return {
      userId: "dev-client",
      email: "owner@client.local",
      name: "Client Owner",
      role: "client_admin",
      tenant,
    };
  }

  return null;
}

export async function requirePortal(): Promise<PortalContext> {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/sign-in");
  return ctx;
}

async function findTenantByOrg(orgId: string): Promise<TenantRow | null> {
  const rows = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.clerkOrgId, orgId))
    .limit(1);
  return rows[0] ?? null;
}

async function roleForUser(tenantId: string, userId: string): Promise<Role> {
  const rows = await db
    .select({ role: schema.memberships.role })
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.tenantId, tenantId),
        eq(schema.memberships.userId, userId)
      )
    )
    .limit(1);
  // Default to client_admin when no explicit membership row exists yet (the
  // first user of a freshly created org is its admin until invites are seeded).
  return rows[0]?.role ?? "client_admin";
}

async function devTenant(): Promise<TenantRow | null> {
  const slug = process.env.CONSOLE_DEV_PORTAL_SLUG;
  if (slug) {
    const rows = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug))
      .limit(1);
    if (rows[0]) return rows[0];
  }
  const rows = await db
    .select()
    .from(schema.tenants)
    .orderBy(schema.tenants.createdAt)
    .limit(1);
  return rows[0] ?? null;
}
