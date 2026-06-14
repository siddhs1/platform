export const dynamic = "force-dynamic";

/**
 * Per-host robots.txt. The middleware matcher excludes /robots.txt from the
 * tenant rewrite, so this handler runs at the app root and reads the Host
 * header directly. The leading "www." is stripped to match the canonical
 * origin used everywhere else. The /api/ lead route is disallowed; the
 * per-host sitemap is advertised.
 */
export async function GET(req: Request): Promise<Response> {
  const rawHost = req.headers.get("host") ?? "";
  const host = rawHost.replace(/^www\./, "");
  const origin = `https://${host}`;
  const LF = String.fromCharCode(10);

  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /internal/",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ];

  return new Response(lines.join(LF), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
