import { resolveSite } from "../../lib/resolve-site";
import { enumerateSitePaths } from "../../lib/generated-pages";

export const dynamic = "force-dynamic";

/**
 * Per-host sitemap.xml. The middleware matcher excludes /sitemap.xml from the
 * tenant rewrite, so this handler runs at the app root, reads the Host header
 * directly (stripping "www." to match the canonical origin), resolves the
 * tenant, and emits every enumerable page. Priority is a coarse signal only:
 * home highest, then money pages, then service and area hubs, with legal
 * pages lowest. lastmod is omitted rather than fabricated.
 */
function priorityFor(path: string): string {
  if (path === "/") return "1.0";
  const segs = path.split("/").filter(Boolean);
  if (segs.length === 2) {
    if (segs[0] === "services") return "0.7";
    if (segs[0] === "areas") return "0.6";
    if (segs[0] === "blog") return "0.4";
    return "0.8";
  }
  if (segs.length === 1) {
    if (segs[0] === "blog") return "0.4";
    if (
      segs[0] === "privacy" ||
      segs[0] === "terms" ||
      segs[0] === "accessibility"
    ) {
      return "0.3";
    }
    return "0.5";
  }
  return "0.5";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: Request): Promise<Response> {
  const rawHost = req.headers.get("host") ?? "";
  const host = rawHost.replace(/^www\./, "");
  const LF = String.fromCharCode(10);

  const site = await resolveSite(host);
  if (!site) {
    return new Response("Not found", { status: 404 });
  }

  const origin = `https://${host}`;
  const paths = enumerateSitePaths(site);

  const urls = paths.map((p) => {
    const loc = escapeXml(origin + p);
    const priority = priorityFor(p);
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].join(LF);
  });

  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    "</urlset>",
    "",
  ].join(LF);

  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
