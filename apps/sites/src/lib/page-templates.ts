/**
 * Standard page templates (Phase 3) - block recipes for the fixed pages
 * every tenant gets: about, services index + detail, areas hub, gallery,
 * reviews, blog index + post, faq, contact, financing, and legal
 * (privacy/terms/accessibility).
 *
 * These are GENERATED at request time (like the money/area pages in
 * generated-pages.ts) rather than seeded per tenant: they live in apps/sites
 * because they derive from the niche service catalog (servicesForNiche) and
 * the business profile, and apps/sites already depends on @platform/blocks
 * (the db package deliberately does not). getPageForRequest() dispatches the
 * canonical paths here; authored pages (e.g. the seeded home) still win.
 *
 * Every block self-populates from niche/context, so the recipes mostly pass
 * a heading + the few data-derived props (service/area links, NAP) a block
 * cannot infer on its own.
 */
import type { SitePage, SiteBlock } from "@platform/db";
import {
  servicesForNiche,
  slugify,
  serviceJsonLd,
  blogPostingJsonLd,
  type ServiceDef,
  type BusinessContext,
} from "@platform/blocks";
import type { ResolvedSite } from "./resolve-site";
import type { RequestedPage } from "./generated-pages";

function homeBusiness(site: ResolvedSite): BusinessContext {
  return { name: site.businessName, niche: site.niche, city: site.city, state: site.state };
}

function block(id: string, type: SiteBlock["type"], variant: string, props: Record<string, unknown>): SiteBlock {
  return { id, type, variant, props };
}

function humanize(slug: string): string {
  return slug.split("-").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatAddress(site: ResolvedSite): string | undefined {
  const a = site.profile?.address;
  if (!a) return undefined;
  const line1 = [a.line1, a.line2].filter(Boolean).join(", ");
  const cityState = [a.city, a.state].filter(Boolean).join(", ");
  const tail = [cityState, a.postalCode].filter(Boolean).join(" ");
  return [line1, tail].filter(Boolean).join(", ") || undefined;
}

const cta = (id: string, heading: string, label: string): SiteBlock =>
  block(id, "cta-band", "default", { heading, ctaLabel: label });

// -- About (A2) --------------------------------------------------------
export function buildAboutPage(site: ResolvedSite): RequestedPage {
  const { businessName: name, niche, city, state } = site;
  const tagline = site.profile?.tagline;
  const page: SitePage = {
    path: "/about",
    title: `About ${name} | ${niche} in ${city}, ${state}`,
    meta: {
      description: `Learn about ${name} - a trusted ${niche.toLowerCase()} serving ${city}, ${state}. Licensed, insured, and committed to quality work.`,
      keywords: [`about ${name}`, `${niche} ${city}`],
    },
    blocks: [
      block("about-hero", "hero", "image-right", {
        heading: `About ${name}`,
        sub: tagline ?? `Your trusted local ${niche.toLowerCase()} in ${city}, ${state}.`,
        ctaLabel: "Get a free quote",
      }),
      block("about-story", "story", "prose", {}),
      block("about-stats", "stats", "cards", {}),
      block("about-credentials", "credentials", "badges", {}),
      block("about-team", "team", "grid", { heading: "Meet the team" }),
      block("about-guarantee", "guarantee", "banner", {}),
      cta("about-cta", "Ready to get started?", "Get a free quote"),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Services index (A3) -----------------------------------------------
export function buildServicesIndexPage(site: ResolvedSite): RequestedPage {
  const { businessName: name, niche, city, state } = site;
  const items = servicesForNiche(niche).map((s) => ({
    title: s.name,
    body: s.blurb,
    href: `/services/${s.slug}`,
  }));
  const page: SitePage = {
    path: "/services",
    title: `Our services | ${name}`,
    meta: {
      description: `Explore the ${niche.toLowerCase()} services ${name} offers in ${city}, ${state}. Free quotes, licensed and insured.`,
      keywords: [`${niche} services ${city}`, `${niche} ${city}`],
    },
    blocks: [
      block("svc-list", "services", "cards", { heading: "Our services", items }),
      block("svc-why", "why-us", "icon-grid", {}),
      cta("svc-cta", "Not sure what you need?", "Talk to us"),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Service detail / overview (A4) - /services/<slug> -----------------
export function buildServiceDetailPage(site: ResolvedSite, service: ServiceDef): RequestedPage {
  const { businessName: name, niche, city, state } = site;
  const serviceLower = service.name.toLowerCase();
  const areaLinks = site.serviceAreas.map((a) => ({
    label: a.city,
    href: `/${service.slug}/${slugify(a.city)}`,
  }));
  const page: SitePage = {
    path: `/services/${service.slug}`,
    title: `${service.name} | ${name}`,
    meta: {
      description: `${name} provides professional ${serviceLower} in ${city}, ${state} and the surrounding area. Licensed, insured, and guaranteed - call for a free quote.`,
      keywords: [`${service.name} ${city}`, `${service.name} near me`],
    },
    blocks: [
      block("sd-hero", "lead-hero", "split", {
        heading: service.name,
        sub: `Professional ${serviceLower} from ${name} - licensed, insured, and guaranteed.`,
        formTitle: `Request ${serviceLower}`,
      }),
      block("sd-included", "included", "checklist", { heading: `What our ${serviceLower} includes` }),
      block("sd-process", "process", "steps", {}),
      block("sd-credentials", "credentials", "badges", {}),
      ...(areaLinks.length
        ? [block("sd-area", "service-area", "city-list", { heading: `${service.name} across our service area`, areaLinks })]
        : []),
      block("sd-guarantee", "guarantee", "banner", {}),
      cta("sd-cta", `Need ${serviceLower}?`, "Get a free quote"),
    ],
  };
  return {
    page,
    blockBusiness: homeBusiness(site),
    extraJsonLd: [serviceJsonLd({ business: name, service: service.name, city, state })],
  };
}

// -- Areas hub (A5) - /areas -------------------------------------------
export function buildAreasHubPage(site: ResolvedSite): RequestedPage {
  const { businessName: name, niche, city, state } = site;
  const areaLinks = site.serviceAreas.map((a) => ({ label: a.city, href: `/areas/${slugify(a.city)}` }));
  const page: SitePage = {
    path: "/areas",
    title: `Service areas | ${name}`,
    meta: {
      description: `${name} proudly serves ${city}, ${state} and the surrounding communities. See all of the areas we cover.`,
      keywords: [`${niche} service area ${city}`, `${niche} near me`],
    },
    blocks: [
      block("areas-list", "service-area", "city-list", { heading: "Areas we serve", areaLinks }),
      block("areas-svc", "services", "icon-grid", { heading: "What we do" }),
      cta("areas-cta", `Serving ${city} and beyond`, "Get a free quote"),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Gallery (A6) ------------------------------------------------------
export function buildGalleryPage(site: ResolvedSite): RequestedPage {
  const { businessName: name, city, state } = site;
  const page: SitePage = {
    path: "/gallery",
    title: `Gallery | ${name}`,
    meta: { description: `See recent work from ${name} in ${city}, ${state}.` },
    blocks: [
      block("gal-grid", "gallery", "grid", { heading: "Our recent work" }),
      cta("gal-cta", "Like what you see?", "Get a free quote"),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Reviews (A7) ------------------------------------------------------
export function buildReviewsPage(site: ResolvedSite): RequestedPage {
  const { businessName: name, city, state } = site;
  const page: SitePage = {
    path: "/reviews",
    title: `Reviews | ${name}`,
    meta: { description: `Read what customers across ${city}, ${state} say about ${name}.` },
    blocks: [
      block("rev-summary", "reviews-feed", "stars-summary", { heading: "What our customers say" }),
      block("rev-wall", "testimonials", "wall", { heading: "In their words" }),
      cta("rev-cta", "Join our happy customers", "Get a free quote"),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Blog index (A8) ---------------------------------------------------
export function buildBlogIndexPage(site: ResolvedSite): RequestedPage {
  const { businessName: name } = site;
  const page: SitePage = {
    path: "/blog",
    title: `Blog | ${name}`,
    meta: { description: `Tips, guides, and news from ${name}.` },
    blocks: [
      block("blog-grid", "blog-index", "grid", { heading: "From our blog" }),
      cta("blog-cta", "Have a question?", "Get in touch"),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Blog post (A8) - /blog/<slug> -------------------------------------
export function buildBlogPostPage(site: ResolvedSite, slug: string): RequestedPage {
  const { businessName: name } = site;
  const title = humanize(slug);
  const description = `${title} - from the ${name} blog.`;
  const page: SitePage = {
    path: `/blog/${slug}`,
    title: `${title} | ${name}`,
    meta: { description },
    blocks: [
      block("post-body", "blog-post", "default", { title, author: name }),
      cta("post-cta", "Ready to get started?", "Get a free quote"),
    ],
  };
  return {
    page,
    blockBusiness: homeBusiness(site),
    extraJsonLd: [blogPostingJsonLd({ business: name, headline: title, description })],
  };
}

// -- FAQ (A9) - faq block emits FAQPage JSON-LD itself -----------------
export function buildFaqPage(site: ResolvedSite): RequestedPage {
  const { businessName: name, city } = site;
  const page: SitePage = {
    path: "/faq",
    title: `FAQ | ${name}`,
    meta: { description: `Answers to common questions about ${name} in ${city}.` },
    blocks: [
      block("faq-main", "faq", "accordion", {}),
      cta("faq-cta", "Still have questions?", "Contact us"),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Contact (A10) -----------------------------------------------------
export function buildContactPage(site: ResolvedSite): RequestedPage {
  const { businessName: name, city, state } = site;
  const page: SitePage = {
    path: "/contact",
    title: `Contact | ${name}`,
    meta: { description: `Get in touch with ${name} in ${city}, ${state}. Call or request a free quote.` },
    blocks: [
      block("contact-main", "contact", "split", {
        heading: "Get in touch",
        phone: site.profile?.phone,
        email: site.profile?.email,
        address: formatAddress(site),
        hours: site.profile?.hours,
      }),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Financing (A12) ---------------------------------------------------
export function buildFinancingPage(site: ResolvedSite): RequestedPage {
  const { businessName: name, niche } = site;
  const page: SitePage = {
    path: "/financing",
    title: `Financing | ${name}`,
    meta: { description: `Flexible financing options from ${name} - get the ${niche.toLowerCase()} work you need now and pay over time.` },
    blocks: [
      block("fin-main", "financing", "cards", {}),
      cta("fin-cta", "Ready to get started?", "Get a free quote"),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}

// -- Legal (A13) - /privacy, /terms, /accessibility --------------------
type LegalKind = "privacy" | "terms" | "accessibility";
const LEGAL_META: Record<LegalKind, { path: string; heading: string }> = {
  privacy: { path: "/privacy", heading: "Privacy Policy" },
  terms: { path: "/terms", heading: "Terms of Service" },
  accessibility: { path: "/accessibility", heading: "Accessibility Statement" },
};

function legalBody(kind: LegalKind, name: string): string[] {
  if (kind === "terms") {
    return [
      `These terms govern your use of the ${name} website and the services we provide. By using this site or engaging our services, you agree to these terms.`,
      `Quotes and estimates are provided in good faith and may be adjusted if the scope of work changes once we assess the job in person. Any such changes will be discussed and approved with you before work proceeds.`,
      `We stand behind our work. If something is not right, contact us and we will make it right in line with the guarantee described to you at the time of service.`,
    ];
  }
  if (kind === "accessibility") {
    return [
      `${name} is committed to making this website accessible to everyone, including people who use assistive technologies. We aim to meet recognized accessibility standards (WCAG 2.1 AA) across the site.`,
      `We continually review the site for accessibility and welcome feedback. If you encounter any difficulty using this website, please contact us and we will do our best to provide the information you need in an accessible format.`,
      `If you need assistance or have an accessibility concern, reach out using the details on our contact page and we will respond promptly.`,
    ];
  }
  // privacy (default)
  return [
    `This page explains how ${name} collects, uses, and protects your information. By using this website, you agree to the practices described here.`,
    `We collect only the information you choose to provide - such as your name, phone number, and email when you request a quote - along with basic, anonymous analytics about how the site is used. We do not sell your personal information to third parties.`,
    `You may request a copy of the information we hold about you, or ask us to delete it, at any time. If you have questions about this policy or your data, please contact us using the details on our contact page.`,
  ];
}

export function buildLegalPage(site: ResolvedSite, kind: LegalKind): RequestedPage {
  const { businessName: name } = site;
  const m = LEGAL_META[kind];
  const page: SitePage = {
    path: m.path,
    title: `${m.heading} | ${name}`,
    meta: { description: `${m.heading} for ${name}.` },
    blocks: [
      block("legal-main", "legal", "prose", { heading: m.heading, body: legalBody(kind, name) }),
    ],
  };
  return { page, blockBusiness: homeBusiness(site), extraJsonLd: [] };
}
