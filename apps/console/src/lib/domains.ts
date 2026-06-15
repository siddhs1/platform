import "server-only";
import { db, schema } from "@platform/db";
import { and, desc, eq } from "drizzle-orm";
import type { SslStatus } from "./cloudflare";

/**
 * Domain rows (hostname -> tenant) for the operator domains UI (C2). The
 * sites-app middleware resolves an incoming host against this table; here the
 * operator adds custom hostnames and tracks Cloudflare SSL status. All ops are
 * scoped to a tenant id (the operator already passed canAccessTenant upstream).
 */

export type DomainRow = typeof schema.domains.$inferSelect;

export async function listDomains(tenantId: string): Promise<DomainRow[]> {
  return db
    .select()
    .from(schema.domains)
    .where(eq(schema.domains.tenantId, tenantId))
    .orderBy(desc(schema.domains.isPrimary), schema.domains.hostname);
}

export async function getDomain(
  tenantId: string,
  id: string
): Promise<DomainRow | null> {
  const rows = await db
    .select()
    .from(schema.domains)
    .where(and(eq(schema.domains.id, id), eq(schema.domains.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function hostnameExists(hostname: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.domains.id })
    .from(schema.domains)
    .where(eq(schema.domains.hostname, hostname))
    .limit(1);
  return rows.length > 0;
}

export async function createDomainRow(input: {
  tenantId: string;
  hostname: string;
  cfHostnameId: string | null;
  sslStatus: SslStatus;
  isPrimary: boolean;
}): Promise<void> {
  await db.insert(schema.domains).values({
    tenantId: input.tenantId,
    hostname: input.hostname,
    isPrimary: input.isPrimary,
    cfHostnameId: input.cfHostnameId,
    sslStatus: input.sslStatus,
  });
}

export async function setDomainSsl(
  tenantId: string,
  id: string,
  sslStatus: SslStatus
): Promise<void> {
  await db
    .update(schema.domains)
    .set({ sslStatus })
    .where(and(eq(schema.domains.id, id), eq(schema.domains.tenantId, tenantId)));
}
