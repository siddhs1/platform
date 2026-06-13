/**
 * Database client. Uses the Neon serverless driver for edge/runtime and
 * exposes a helper to run queries inside a tenant RLS context.
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = neon(connectionString);
export const db = drizzle(client, { schema });

export { schema };
export * from "./types";

/**
 * Set the tenant context for RLS for the lifetime of the current
 * connection/transaction. Call this before tenant-scoped queries in the
 * console. The sites app reads published config by hostname and can run
 * unscoped reads via a dedicated read role.
 */
export async function setTenantContext(tenantId: string) {
  await db.execute(
    sql`select set_config('app.tenant_id', ${tenantId}, true)`
  );
}
