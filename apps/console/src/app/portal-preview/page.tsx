import { Fragment } from "react";
import {
  renderBlock,
  tokensToCssVars,
  localBusinessJsonLd,
} from "@platform/blocks";
import type { BusinessContext } from "@platform/blocks";
import { requirePortal } from "@/lib/portal";
import { getConfig } from "@/lib/queries";

export const dynamic = "force-dynamic";

const notice: React.CSSProperties = {
  padding: "40px",
  fontFamily: "system-ui, sans-serif",
  color: "#514a42",
};

/**
 * Chrome-less live preview of the signed-in client's DRAFT site, rendered
 * through @platform/blocks (the exact production renderer). Lives OUTSIDE the
 * /portal route group, so it loads neither the portal shell nor portal.css -
 * full style isolation, matching the operator /preview. The tenant comes from
 * the session (requirePortal), never the URL, so there is no spoofing surface;
 * the portal site editor embeds this in an iframe.
 */
export default async function PortalPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string | string[] }>;
}) {
  const ctx = await requirePortal();
  const sp = await searchParams;
  const pathRaw = Array.isArray(sp.path) ? sp.path[0] : sp.path;

  const draft = await getConfig(ctx.tenant.id, "draft");
  if (!draft) {
    return <div style={notice}>Your site is not set up yet.</div>;
  }

  const requestedPath = pathRaw && pathRaw.startsWith("/") ? pathRaw : "/";
  const page =
    draft.pages.find((p) => p.path === requestedPath) ?? draft.pages[0];
  if (!page) {
    return <div style={notice}>There is nothing to preview yet.</div>;
  }

  const cssVars = tokensToCssVars(draft.tokens);
  const business: BusinessContext = {
    name: ctx.tenant.businessName,
    niche: ctx.tenant.niche,
    city: ctx.tenant.city,
    state: ctx.tenant.state,
  };
  const jsonLd = localBusinessJsonLd(business);

  return (
    <div style={cssVars} data-tenant={ctx.tenant.id}>
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
