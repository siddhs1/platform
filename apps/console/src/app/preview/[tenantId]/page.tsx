import { Fragment } from "react";
import { notFound } from "next/navigation";
import {
  renderBlock,
  tokensToCssVars,
  localBusinessJsonLd,
} from "@platform/blocks";
import type { BusinessContext } from "@platform/blocks";
import { requireSession } from "@/lib/auth";
import { getTenant, getConfig } from "@/lib/queries";

export const dynamic = "force-dynamic";

const notice: React.CSSProperties = {
  padding: "40px",
  fontFamily: "system-ui, sans-serif",
  color: "#514a42",
};

/**
 * Chrome-less live preview of a tenant's DRAFT site config. Rendered through
 * @platform/blocks - the exact renderer the production sites app uses - so
 * what the operator sees here matches what publishing will ship. Lives
 * outside the (app) route group, so it loads neither the console's global
 * stylesheet nor the operator shell; the editor embeds it in an iframe for
 * full style isolation. Requires a session and tenant access.
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { tenantId } = await params;
  const { path } = await searchParams;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) notFound();

  const draft = await getConfig(tenant.id, "draft");
  if (!draft) {
    return <div style={notice}>No draft configuration exists for this tenant yet.</div>;
  }

  const requestedPath = path && path.startsWith("/") ? path : "/";
  const page =
    draft.pages.find((p) => p.path === requestedPath) ?? draft.pages[0];
  if (!page) {
    return <div style={notice}>This draft has no pages to preview.</div>;
  }

  const cssVars = tokensToCssVars(draft.tokens);
  const business: BusinessContext = {
    name: tenant.businessName,
    niche: tenant.niche,
    city: tenant.city,
    state: tenant.state,
  };
  const jsonLd = localBusinessJsonLd(business);

  return (
    <div style={cssVars} data-tenant={tenant.id}>
      {draft.customCss ? (
        <style dangerouslySetInnerHTML={{ __html: draft.customCss }} />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        {page.blocks.map((block) => (
          <Fragment key={block.id}>
            {renderBlock(block, {
              tokens: draft.tokens,
              featureFlags: draft.featureFlags,
              business,
            })}
          </Fragment>
        ))}
      </main>
    </div>
  );
}
