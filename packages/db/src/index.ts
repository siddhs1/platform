/**
 * Database client. Uses the Neon serverless driver for edge/runtime and
 * exposes a helper to run queries inside a tenant RLS context.
 *
 * The client is created LAZILY on first use. Importing this module (e.g.
 * during `next build`, which has no DATABASE_URL) must not throw - the
 * connection (and the DATABASE_URL requirement) is deferred until a query
 * actually runs at request time.
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

function createDb(connectionString: string | undefined) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle(neon(connectionString), { schema });
}

type DrizzleClient = ReturnType<typeof createDb>;

let _db: DrizzleClient | undefined;
function getDb(): DrizzleClient {
  return (_db ??= createDb(process.env.DATABASE_URL));
}

/**
 * Read-only client for the PUBLIC sites app. Uses SITES_DATABASE_URL when set
 * -- the least-privilege `sites_reader` role (SELECT on tenants/domains/
 * site_configs only, BYPASSRLS for hostname-keyed published reads; see
 * roles.sql) -- and falls back to DATABASE_URL so behaviour is identical until
 * the owner provisions the role. The console always uses `db` (the RLS-subject
 * app role). This narrows the blast radius of the internet-facing app: a
 * compromise of the sites read path cannot read leads/PII or write anything.
 */
let _readDb: DrizzleClient | undefined;
function getReadDb(): DrizzleClient {
  return (_readDb ??= createDb(
    process.env.SITES_DATABASE_URL ?? process.env.DATABASE_URL
  ));
}

/**
 * Lazy proxy: preserves the `db.select()...` API while deferring the
 * connection to first property access, so module import is side-effect
 * free and build-safe.
 */
export const db = new Proxy({} as DrizzleClient, {
  get(_target, prop) {
    const instance = getDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

/** Read-only proxy backed by getReadDb() (see above). */
export const readDb = new Proxy({} as DrizzleClient, {
  get(_target, prop) {
    const instance = getReadDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
export * from "./types";
export * from "./presets";

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
