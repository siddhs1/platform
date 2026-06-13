/**
 * The renderer. Resolves the tenant from the [host] segment, finds the
 * page matching the request path, and renders its blocks through the
 * shared registry. Unknown block types render nothing (never crash a
 * client site). Tokens are injected as CSS variables; JSON-LD schema is
 * emitted per page.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveSite } from "../../../../lib/resolve-site";
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
  const current =
    site.pages.find((p) => p.path === pathFromSegments(path)) ??
    site.pages[0];
  return {
    title: current?.title ?? site.businessName,
    description: current?.meta.description,
    keywords: current?.meta.keywords,
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

  const requestedPath = pathFromSegments(path);
  const page =
    site.pages.find((p) => p.path === requestedPath) ??
    (requestedPath === "/" ? site.pages[0] : undefined);
  if (!page) notFound();

  const cssVars = tokensToCssVars(site.tokens);

  return (
    <div style={cssVars} data-tenant={site.tenantId}>
      {/* Per-tenant scoped CSS (L3), capped + sanitized upstream */}
      {site.customCss ? (
        <style dangerouslySetInnerHTML={{ __html: site.customCss }} />
      ) : null}

      {/* LocalBusiness schema for local SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            localBusinessJsonLd({
              name: site.businessName,
              niche: site.niche,
              city: site.city,
              state: site.state,
            })
          ),
        }}
      />

      <main>
        {page.blocks.map((block) =>
          renderBlock(block, {
            tokens: site.tokens,
            featureFlags: site.featureFlags,
            business: {
              name: site.businessName,
              niche: site.niche,
              city: site.city,
              state: site.state,
            },
          })
        )}
      </main>
    </div>
  );
}
