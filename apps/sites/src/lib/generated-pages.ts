/**
 * Per-service / per-city page generation.
 *
 * The renderer asks getPageForRequest() for the page matching a request
 * path. Authored pages (from site_configs.pages) win. If none match, we
 * SYNTHESIZE a page from tenant data + the niche service catalog:
 *
 *   /areas/<city>            -> a city hub linking to that city's services
 *   /<service>/<city>        -> a "service in city" money page
 *
 * Generated pages are rendered with a business context scoped to the
 * TARGET city (so on-page copy reads "… in Orlando", not the HQ city),
 * and money pages also emit a Service JSON-LD for the city. Nothing is
 * persisted — pages are built per request, so adding a service area is
 * pure data (no migration, no redeploy).
 */
import type { SitePage, SiteBlock, ServiceArea } from "@platform/db";
import {
  slugify,
  servicesForNiche,
  findServiceBySlug,
  serviceJsonLd,
  type BusinessContext,
} from "@platform/blocks";
import type { ResolvedSite } from "./resolve-site";

export interface RequestedPage {
  page: SitePage;
  /** Business context used for block rendering (city-scoped for generated pages). */
  blockBusiness: BusinessContext;
  /** Extra JSON-LD beyond the always-emitted LocalBusiness (e.g. Service). */
  extraJsonLd: object[];
}

function homeBusiness(site: ResolvedSite): BusinessContext {
  return {
    name: site.businessName,
    niche: site.niche,
    city: site.city,
    state: site.state,
  };
}

function areaBySlug(
  site: ResolvedSite,
  citySlug: string
): ServiceArea | undefined {
  return site.serviceAreas.find((a) => slugify(a.city) === citySlug);
}

function block(
  id: string,
  type: SiteBlock["type"],
  variant: string,
  props: Record<string, unknown>
): SiteBlock {
  return { id, type, variant, props };
}

/** Links to every service area's hub (used to interlink generated pages). */
function areaHubLinks(site: ResolvedSite) {
  return site.serviceAreas.map((a) => ({
    label: a.city,
    href: `/areas/${slugify(a.city)}`,
  }));
}

// ── City hub: /areas/<city> ───────────────────────────────────────────
function buildCityHubPage(site: ResolvedSite, area: ServiceArea): RequestedPage {
  const { city, state } = area;
  const citySlug = slugify(city);
  const nicheLower = site.niche.toLowerCase();

  const serviceItems = servicesForNiche(site.niche).map((s) => ({
    title: s.name,
    body: s.blurb,
    href: `/${s.slug}/${citySlug}`,
  }));

  const page: SitePage = {
    path: `/areas/${citySlug}`,
    title: `${site.businessName} in ${city}, ${state}`,
    meta: {
      description: `${site.businessName} — trusted ${nicheLower} serving ${city}, ${state}. Free quotes, licensed and insured.`,
      keywords: [`${site.niche} ${city}`, `${site.niche} in ${city}`],
    },
    blocks: [
      block("gen-hero", "hero", "image-right", {
        heading: `${site.businessName} in ${city}, ${state}`,
        sub: `Trusted ${nicheLower} serving ${city} and the surrounding area.`,
        ctaLabel: "Get a free quote",
      }),
      block("gen-services", "services", "cards", {
        heading: `What we do in ${city}`,
        items: serviceItems,
      }),
      block("gen-cta", "cta-band", "default", {
        heading: `Ready to get started in ${city}?`,
        ctaLabel: "Call now",
      }),
      block("gen-area", "service-area", "city-list", {
        heading: "Areas we serve",
        areaLinks: areaHubLinks(site),
      }),
      block("gen-contact", "contact-form", "split", {
        heading: `Request a quote in ${city}`,
      }),
    ],
  };

  return {
    page,
    blockBusiness: { name: site.businessName, niche: site.niche, city, state },
    extraJsonLd: [],
  };
}

// ── Money page: /<service>/<city> ─────────────────────────────────────
function buildMoneyPage(
  site: ResolvedSite,
  serviceName: string,
  serviceSlug: string,
  area: ServiceArea
): RequestedPage {
  const { city, state } = area;
  const citySlug = slugify(city);
  const nicheLower = site.niche.toLowerCase();
  const serviceLower = serviceName.toLowerCase();

  // Cross-link siblings: same set of services, all in THIS city.
  const serviceItems = servicesForNiche(site.niche).map((s) => ({
    title: s.name,
    body: s.blurb,
    href: `/${s.slug}/${citySlug}`,
  }));

  // Cluster the SAME service across our other cities.
  const sameServiceElsewhere = site.serviceAreas.map((a) => ({
    label: a.city,
    href: `/${serviceSlug}/${slugify(a.city)}`,
  }));

  const page: SitePage = {
    path: `/${serviceSlug}/${citySlug}`,
    title: `${serviceName} in ${city}, ${state} | ${site.businessName}`,
    meta: {
      description: `${site.businessName} provides ${serviceLower} in ${city}, ${state}. Licensed, insured, and trusted by your neighbors — call for a free quote.`,
      keywords: [
        `${serviceName} ${city}`,
        `${serviceName} in ${city}`,
        `${serviceName} near me`,
      ],
    },
    blocks: [
      block("gen-hero", "hero", "image-right", {
        heading: `${serviceName} in ${city}`,
        sub: `${site.businessName} — licensed, insured ${nicheLower} serving ${city}, ${state}.`,
        ctaLabel: "Get a free quote",
      }),
      block("gen-services", "services", "cards", {
        heading: `Our ${city} services`,
        items: serviceItems,
      }),
      block("gen-testimonials", "testimonials", "carousel", {
        heading: `What ${city} customers say`,
      }),
      block("gen-cta", "cta-band", "default", {
        heading: `Need ${serviceLower} in ${city}?`,
        ctaLabel: "Call now",
      }),
      block("gen-area", "service-area", "city-list", {
        heading: `${serviceName} in nearby cities`,
        areaLinks: sameServiceElsewhere,
      }),
      block("gen-contact", "contact-form", "split", {
        heading: `Request ${serviceLower} in ${city}`,
      }),
    ],
  };

  return {
    page,
    blockBusiness: { name: site.businessName, niche: site.niche, city, state },
    extraJsonLd: [
      serviceJsonLd({
        business: site.businessName,
        service: serviceName,
        city,
        state,
      }),
    ],
  };
}

/**
 * Resolve a request path to a page: authored first, then generated, then
 * null (→ the route 404s).
 */
export function getPageForRequest(
  site: ResolvedSite,
  requestedPath: string
): RequestedPage | null {
  const authored = site.pages.find((p) => p.path === requestedPath);
  if (authored) {
    return { page: authored, blockBusiness: homeBusiness(site), extraJsonLd: [] };
  }

  const segments = requestedPath.split("/").filter(Boolean);
  if (segments.length !== 2) return null;

  const [first, second] = segments as [string, string];

  // /areas/<city>
  if (first === "areas") {
    const area = areaBySlug(site, second);
    return area ? buildCityHubPage(site, area) : null;
  }

  // /<service>/<city>
  const service = findServiceBySlug(site.niche, first);
  const area = areaBySlug(site, second);
  if (service && area) {
    return buildMoneyPage(site, service.name, service.slug, area);
  }

  return null;
}
