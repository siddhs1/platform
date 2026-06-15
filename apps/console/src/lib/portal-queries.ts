import "server-only";
import { db, schema } from "@platform/db";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { LeadRow } from "./queries";

/**
 * Read-only dashboard aggregates for the client portal (B1). Everything is
 * scoped to a single tenant_id (the caller passes ctx.tenant.id). Reviews and
 * real call answered/missed data arrive in Phase 2; this v1 sources what
 * already exists (leads + published config history) and the dashboard renders
 * honest "coming soon" / empty states for the rest.
 */

export interface WhatsNewItem {
  kind: "published";
  version: number;
  at: Date;
}

export interface DashboardData {
  leadsThisMonth: number;
  leadsLastMonth: number;
  callsThisMonth: number;
  /** sum of value_estimate across this month's leads (those that have one) */
  pipelineValue: number;
  /** how many of this month's leads carry a value estimate */
  pipelineLeadCount: number;
  /** leads per day, first of month -> today, for a sparkline */
  sparkline: number[];
  recentLeads: LeadRow[];
  whatsNew: WhatsNewItem[];
  hasAnyData: boolean;
}

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Count of leads still in "new" status, for the nav badge. */
export async function newLeadCount(tenantId: string): Promise<number> {
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.leads)
    .where(
      and(eq(schema.leads.tenantId, tenantId), eq(schema.leads.status, "new"))
    );
  return rows[0]?.c ?? 0;
}

async function countLeads(
  tenantId: string,
  from: Date,
  to: Date | null,
  source?: string
): Promise<number> {
  const conds = [
    eq(schema.leads.tenantId, tenantId),
    gte(schema.leads.createdAt, from),
  ];
  if (to) conds.push(lt(schema.leads.createdAt, to));
  if (source) conds.push(eq(schema.leads.source, source));
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.leads)
    .where(and(...conds));
  return rows[0]?.c ?? 0;
}

export async function getDashboard(tenantId: string): Promise<DashboardData> {
  const now = new Date();
  const thisStart = monthStart(now);
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const leadsThisMonth = await countLeads(tenantId, thisStart, null);
  const leadsLastMonth = await countLeads(tenantId, lastStart, thisStart);
  const callsThisMonth = await countLeads(tenantId, thisStart, null, "call");

  const pipe = await db
    .select({
      total: sql<string>`coalesce(sum(${schema.leads.valueEstimate}), 0)`,
      n: sql<number>`count(${schema.leads.valueEstimate})::int`,
    })
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.tenantId, tenantId),
        gte(schema.leads.createdAt, thisStart)
      )
    );

  const days = await db
    .select({
      d: sql<string>`to_char(${schema.leads.createdAt}, 'YYYY-MM-DD')`,
      c: sql<number>`count(*)::int`,
    })
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.tenantId, tenantId),
        gte(schema.leads.createdAt, thisStart)
      )
    )
    .groupBy(sql`to_char(${schema.leads.createdAt}, 'YYYY-MM-DD')`);
  const byDay: Record<string, number> = {};
  for (const r of days) byDay[r.d] = r.c;
  const sparkline: number[] = [];
  for (let i = 1; i <= now.getDate(); i++) {
    sparkline.push(byDay[dayKey(new Date(now.getFullYear(), now.getMonth(), i))] ?? 0);
  }

  const recentLeads = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.tenantId, tenantId))
    .orderBy(desc(schema.leads.createdAt))
    .limit(5);

  const versions = await db
    .select({
      version: schema.configVersions.version,
      at: schema.configVersions.publishedAt,
    })
    .from(schema.configVersions)
    .where(eq(schema.configVersions.tenantId, tenantId))
    .orderBy(desc(schema.configVersions.version))
    .limit(4);
  const whatsNew: WhatsNewItem[] = versions.map((v) => ({
    kind: "published",
    version: v.version,
    at: v.at,
  }));

  const hasAnyData =
    leadsThisMonth + leadsLastMonth > 0 ||
    recentLeads.length > 0 ||
    whatsNew.length > 0;

  return {
    leadsThisMonth,
    leadsLastMonth,
    callsThisMonth,
    pipelineValue: Number(pipe[0]?.total ?? 0),
    pipelineLeadCount: pipe[0]?.n ?? 0,
    sparkline,
    recentLeads,
    whatsNew,
    hasAnyData,
  };
}
