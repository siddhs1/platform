/**
 * The renderer. Resolves the tenant from the [host] segment, then asks
 * getPageForRequest for the page matching the request path — an authored
 * page, or a generated /<service>/<city> or /areas/<city> page. Unknown
 * paths 404; unknown block types render nothing (never crash a client
 * site). Tokens are injected as CSS variables; LocalBusiness JSON-LD is
 * always emitted, plus any page-specific schema (e.g. Service).
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveSite } from "../../../../lib/resolve-site";
import { getPageForRequest } from "../../../../lib/generated-pages";
import {
  renderBlock,
  tokensToCssVars,
  localBusinessJsonLd,
} from "@platform/blocks";

interface Params {
  host: string;
  path?: string[];
}

function pathFromSegments(segments?: string[]): string {
  if (!segments || segments.length === 0) return "/";
  return "/" + segments.join("/");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { host, path } = await params;
  const site = await resolveSite(decodeURIComponent(host));
  if (!site) return {};
  const requested = getPageForRequest(site, pathFromSegments(path));
  if (!requested) return {};
  const { page } = requested;
  return {
    title: page.title ?? site.businessName,
    description: page.meta.description,
    keywords: page.meta.keywords,
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { host, path } = await params;
  const site = await resolveSite(decodeURIComponent(host));
  if (!site) notFound();

  const requested = getPageForRequest(site, pathFromSegments(path));
  if (!requested) notFound();
  const { page, blockBusiness, extraJsonLd } = requested;

  const cssVars = tokensToCssVars(site.tokens);

  // Always emit LocalBusiness for the HQ; generated money pages add a
  // city-scoped Service entry via extraJsonLd.
  const jsonLd: object[] = [
    localBusinessJsonLd({
      name: site.businessName,
      niche: site.niche,
      city: site.city,
      state: site.state,
    }),
    ...extraJsonLd,
  ];

  return (
    <div style={cssVars} data-tenant={site.tenantId}>
      {/* Per-tenant scoped CSS (L3), capped + sanitized upstream */}
      {site.customCss ? (
        <style dangerouslySetInnerHTML={{ __html: site.customCss }} />
      ) : null}

      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <main>
        {page.blocks.map((block) =>
          renderBlock(block, {
            tokens: site.tokens,
            featureFlags: site.featureFlags,
            business: blockBusiness,
          })
        )}
      </main>
    </div>
  );
}
