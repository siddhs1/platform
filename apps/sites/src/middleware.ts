/**
 * Hostname routing - the core of the multi-tenant sites app.
 *
 * Every incoming request is rewritten to an internal /_sites/[host]/...
 * path. The tenant is resolved from the hostname inside the route (where
 * we have DB access and caching), not here - middleware runs on the edge
 * and stays cheap: it only normalizes the host and rewrites the URL.
 *
 * Locally, demo tenants resolve as subdomains of localhost:
 *   demo-roofing.localhost:3000  ->  /_sites/demo-roofing.localhost:3000/
 * In production, client custom domains (joesroofing.com) hit Cloudflare
 * for SaaS, which forwards to this app with the original Host header.
 */
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  // Skip static assets, _next internals, and the API namespace.
  matcher: ["/((?!_next/|_static/|api/|favicon.ico|robots.txt|sitemap.xml|internal/).*)"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const rawHost = req.headers.get("host") ?? "";
  const host = rawHost.replace(/^www\./, "");

  const incoming = url.pathname;
  url.pathname = `/sites/${host}${url.pathname}`;
  console.log(`[mw] host=${host} incoming=${incoming} rewritten=${url.pathname}`);
  return NextResponse.rewrite(url);
}
