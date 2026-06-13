import "server-only";
import { db, schema } from "@platform/db";
import type { SiteTokens, SitePage, FeatureFlags } from "@platform/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Session } from "./auth";
import { isOperator } from "./clerk";

export type TenantRow = typeof schema.tenants.$inferSelect;
export type LeadRow = typeof schema.leads.$inferSelect;
export type ChangeRequestRow = typeof schema.changeRequests.$inferSelect;

/**
 * IMPORTANT — tenant isolation in the console.
 * Every query below filters explicitly by tenant_id (or intentionally
 * reads across all tenants for operator views). We do NOT depend on
 * Postgres RLS context here: the app talks to Neon over the stateless
 * neon-http driver, where a transaction-local `set_config('app.tenant_id')`
 * does not persist across the separate HTTP calls Drizzle makes. Explicit
 * WHERE clauses are the source of truth; RLS remains defense-in-depth.
 */

/** Tenants visible to the session. Operators see all; a client sees only
 *  the tenant bound to their Clerk org. */
export async function listTenants(session: Session): Promise<TenantRow[]> {
  if (!isOperator(session.role)) {
    if (!session.orgId) return [];
    return db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.clerkOrgId, session.orgId))
      .orderBy(schema.tenants.businessName);
  }
  return db
    .select()
    .from(schema.tenants)
    .orderBy(schema.tenants.businessName);
}

export function canAccessTenant(
  session: Session,
  tenant: Pick<TenantRow, "clerkOrgId">
): boolean {
  if (isOperator(session.role)) return true;
  return !!session.orgId && session.orgId === tenant.clerkOrgId;
}

export async function getTenant(
  session: Session,
  tenantId: string
): Promise<TenantRow | null> {
  const rows = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1);
  const tenant = rows[0] ?? null;
  if (!tenant || !canAccessTenant(session, tenant)) return null;
  return tenant;
}

/** new-lead counts keyed by tenant id, for the dashboard badges. */
export async function newLeadCountsByTenant(
  tenantIds: string[]
): Promise<Record<string, number>> {
  if (tenantIds.length === 0) return {};
  const rows = await db
    .select({
      tenantId: schema.leads.tenantId,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.leads)
    .where(
      and(
        inArray(schema.leads.tenantId, tenantIds),
        eq(schema.leads.status, "new")
      )
    )
    .groupBy(schema.leads.tenantId);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.tenantId] = r.count;
  return out;
}

export async function listLeads(tenantId: string): Promise<LeadRow[]> {
  return db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.tenantId, tenantId))
    .orderBy(desc(schema.leads.createdAt));
}

export interface SiteConfigRow {
  id: string;
  state: "draft" | "published";
  tokens: SiteTokens;
  pages: SitePage[];
  customCss: string;
  featureFlags: FeatureFlags;
  version: number;
  publishedAt: Date | null;
  updatedAt: Date;
}

export async function getConfig(
  tenantId: string,
  state: "draft" | "published"
): Promise<SiteConfigRow | null> {
  const rows = await db
    .select({
      id: schema.siteConfigs.id,
      state: schema.siteConfigs.state,
      tokens: schema.siteConfigs.tokens,
      pages: schema.siteConfigs.pages,
      customCss: schema.siteConfigs.customCss,
      featureFlags: schema.siteConfigs.featureFlags,
      version: schema.siteConfigs.version,
      publishedAt: schema.siteConfigs.publishedAt,
      updatedAt: schema.siteConfigs.updatedAt,
    })
    .from(schema.siteConfigs)
    .where(
      and(
        eq(schema.siteConfigs.tenantId, tenantId),
        eq(schema.siteConfigs.state, state)
      )
    )
    .limit(1);
  return (rows[0] as SiteConfigRow | undefined) ?? null;
}

export async function getPrimaryDomain(
  tenantId: string
): Promise<string | null> {
  const rows = await db
    .select({ hostname: schema.domains.hostname })
    .from(schema.domains)
    .where(eq(schema.domains.tenantId, tenantId))
    .orderBy(desc(schema.domains.isPrimary))
    .limit(1);
  return rows[0]?.hostname ?? null;
}

export async function listChangeRequests(
  tenantId: string
): Promise<ChangeRequestRow[]> {
  return db
    .select()
    .from(schema.changeRequests)
    .where(eq(schema.changeRequests.tenantId, tenantId))
    .orderBy(desc(schema.changeRequests.createdAt));
}

/* ───────────────────────── mutations ─────────────────────────
 * Writes scope by tenant_id explicitly too. The lead-status update
 * matches on (id AND tenant_id) so a mis-routed id can never touch a
 * different tenant's row. Authorization (operator vs client scope) is
 * enforced in the calling server action via canAccessTenant() before
 * these run.
 */

export async function updateLeadStatus(
  tenantId: string,
  leadId: string,
  status: LeadRow["status"]
): Promise<void> {
  await db
    .update(schema.leads)
    .set({ status })
    .where(
      and(eq(schema.leads.id, leadId), eq(schema.leads.tenantId, tenantId))
    );
}

export async function createCallLead(input: {
  tenantId: string;
  name?: string | null;
  phone?: string | null;
  callSid?: string | null;
}): Promise<void> {
  await db.insert(schema.leads).values({
    tenantId: input.tenantId,
    source: "call",
    name: input.name ?? null,
    phone: input.phone ?? null,
    message: "Inbound phone call",
    twilioCallSid: input.callSid ?? null,
  });
}

/** Session-less tenant lookup by slug, for public webhooks (e.g. Twilio).
 *  Callers must not expose tenant data to end users through this. */
export async function findTenantBySlug(
  slug: string
): Promise<TenantRow | null> {
  const rows = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}
