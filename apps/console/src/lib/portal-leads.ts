import "server-only";
import { db, schema } from "@platform/db";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { LeadRow } from "./queries";
import type { LeadStatus } from "./lead-status";

/**
 * Leads data layer for the CLIENT PORTAL (Surface C, B2 + B3).
 *
 * Every read and write is scoped explicitly to the caller's tenant_id
 * (ctx.tenant.id from requirePortal()). The portal never takes a tenant id
 * from the URL; a lead id from the URL is always paired with the session
 * tenant in the WHERE clause, so a forged id from another tenant resolves to
 * nothing (and updates nothing). RLS remains defense-in-depth.
 */

export type LeadActivityRow = typeof schema.leadActivities.$inferSelect;

export const PORTAL_LEADS_PER_PAGE = 25;

export interface LeadFilters {
  status?: LeadStatus | null;
  source?: string | null;
  q?: string | null;
  page?: number;
}

export interface PortalLeadsResult {
  rows: LeadRow[];
  total: number;
  /** count per status under the active source + search (ignores status filter) */
  statusCounts: Record<string, number>;
  page: number;
  perPage: number;
  hasMore: number; // count of leads beyond this page
}

/** Conditions shared by the list query and the status-count query. */
function baseConds(tenantId: string, f: LeadFilters) {
  const conds = [eq(schema.leads.tenantId, tenantId)];
  if (f.source) conds.push(eq(schema.leads.source, f.source));
  const q = f.q?.trim();
  if (q) {
    const like = `%${q}%`;
    const m = or(
      ilike(schema.leads.name, like),
      ilike(schema.leads.phone, like),
      ilike(schema.leads.email, like),
      ilike(schema.leads.message, like)
    );
    if (m) conds.push(m);
  }
  return conds;
}

export async function listPortalLeads(
  tenantId: string,
  f: LeadFilters
): Promise<PortalLeadsResult> {
  const perPage = PORTAL_LEADS_PER_PAGE;
  const page = Math.max(1, f.page ?? 1);
  const offset = (page - 1) * perPage;

  // status counts under the active source/search filter (not the status tab)
  const grouped = await db
    .select({
      status: schema.leads.status,
      c: sql<number>`count(*)::int`,
    })
    .from(schema.leads)
    .where(and(...baseConds(tenantId, f)))
    .groupBy(schema.leads.status);
  const statusCounts: Record<string, number> = {};
  let allCount = 0;
  for (const g of grouped) {
    statusCounts[g.status] = g.c;
    allCount += g.c;
  }

  const listConds = baseConds(tenantId, f);
  if (f.status) listConds.push(eq(schema.leads.status, f.status));
  const total = f.status ? statusCounts[f.status] ?? 0 : allCount;

  const rows = await db
    .select()
    .from(schema.leads)
    .where(and(...listConds))
    .orderBy(desc(schema.leads.createdAt))
    .limit(perPage)
    .offset(offset);

  const hasMore = Math.max(0, total - (offset + rows.length));
  return { rows, total, statusCounts, page, perPage, hasMore };
}

export async function getPortalLead(
  tenantId: string,
  leadId: string
): Promise<LeadRow | null> {
  const rows = await db
    .select()
    .from(schema.leads)
    .where(
      and(eq(schema.leads.id, leadId), eq(schema.leads.tenantId, tenantId))
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listLeadActivities(
  tenantId: string,
  leadId: string
): Promise<LeadActivityRow[]> {
  return db
    .select()
    .from(schema.leadActivities)
    .where(
      and(
        eq(schema.leadActivities.tenantId, tenantId),
        eq(schema.leadActivities.leadId, leadId)
      )
    )
    .orderBy(desc(schema.leadActivities.createdAt));
}

/* ------------------------------ mutations ------------------------------
 * Writes match on (lead id AND tenant id). The activity insert and the lead
 * update are separate statements (no transaction over neon-http); the lead
 * row is the source of truth and the activity is an append-only log, so a
 * rare partial failure leaves the lead correct and merely drops one log line.
 */

/** Update status and append a status_change activity. Returns true if it
 *  actually changed (caller already holds the prior status). */
export async function setLeadStatusLogged(
  tenantId: string,
  leadId: string,
  from: LeadStatus,
  to: LeadStatus,
  actor: string | null
): Promise<boolean> {
  if (from === to) return false;
  await db
    .update(schema.leads)
    .set({ status: to })
    .where(
      and(eq(schema.leads.id, leadId), eq(schema.leads.tenantId, tenantId))
    );
  await db.insert(schema.leadActivities).values({
    tenantId,
    leadId,
    kind: "status_change",
    body: `${from} -> ${to}`,
    actor,
  });
  return true;
}

export async function addLeadNote(
  tenantId: string,
  leadId: string,
  body: string,
  actor: string | null
): Promise<void> {
  await db.insert(schema.leadActivities).values({
    tenantId,
    leadId,
    kind: "note",
    body,
    actor,
  });
}

/** Update the estimated value and log it as a note. value is a decimal
 *  string (e.g. "2500.00") or null to clear. */
export async function setLeadValueLogged(
  tenantId: string,
  leadId: string,
  value: string | null,
  display: string,
  actor: string | null
): Promise<void> {
  await db
    .update(schema.leads)
    .set({ valueEstimate: value })
    .where(
      and(eq(schema.leads.id, leadId), eq(schema.leads.tenantId, tenantId))
    );
  await db.insert(schema.leadActivities).values({
    tenantId,
    leadId,
    kind: "note",
    body: value ? `Estimated value set to ${display}` : "Estimated value cleared",
    actor,
  });
}
