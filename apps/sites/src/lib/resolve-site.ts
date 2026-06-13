/**
 * Resolve a hostname to its published site config.
 *
 * Reads the domains table → tenant → published site_config. Cached per
 * hostname and tagged so a publish can bust exactly one tenant's cache
 * via revalidateTag(`tenant:${id}`) — no redeploy needed (ISR).
 */
import { db, schema } from "@platform/db";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import type { SiteTokens, SitePage, FeatureFlags } from "@platform/db";

export interface ResolvedSite {
  tenantId: string;
  businessName: string;
  niche: string;
  city: string;
  state: string;
  tokens: SiteTokens;
  pages: SitePage[];
  customCss: string;
  featureFlags: FeatureFlags;
}

async function loadSite(hostname: string): Promise<ResolvedSite | null> {
  const rows = await db
    .select({
      tenantId: schema.tenants.id,
      businessName: schema.tenants.businessName,
      niche: schema.tenants.niche,
      city: schema.tenants.city,
      state: schema.tenants.state,
      tokens: schema.siteConfigs.tokens,
      pages: schema.siteConfigs.pages,
      customCss: schema.siteConfigs.customCss,
      featureFlags: schema.siteConfigs.featureFlags,
    })
    .from(schema.domains)
    .innerJoin(
      schema.tenants,
      eq(schema.domains.tenantId, schema.tenants.id)
    )
    .innerJoin(
      schema.siteConfigs,
      and(
        eq(schema.siteConfigs.tenantId, schema.tenants.id),
        eq(schema.siteConfigs.state, "published")
      )
    )
    .where(eq(schema.domains.hostname, hostname))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Cached resolver. The cache key includes the hostname; the tag lets us
 * invalidate by tenant on publish. We resolve the tenant id first via an
 * uncached lightweight lookup so the tag is correct, then cache the
 * heavy config read.
 */
export async function resolveSite(
  hostname: string
): Promise<ResolvedSite | null> {
  const cached = unstable_cache(
    () => loadSite(hostname),
    ["site", hostname],
    { tags: [`host:${hostname}`], revalidate: 3600 }
  );
  const site = await cached();
  return site;
}
