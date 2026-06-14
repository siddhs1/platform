/**
 * Site navigation model.
 *
 * Derives the chrome's navigation from tenant DATA - the niche service
 * catalog, service areas, the authored page set, and the business profile -
 * so the header, footer, and (later) breadcrumbs all read from one place and
 * stay in sync without hand-authoring. Pure module (no React): the layout in
 * sites/[host] consumes the returned shape; nothing here renders.
 *
 * Link targets are the canonical public-site routes:
 *   /                  home
 *   /services          services index   (A3)
 *   /services/<slug>   service detail   (A4)
 *   /areas             service-area hub (A5)
 *   /areas/<city>      city hub         (generated)
 *   /about /reviews /blog /contact      standard pages (A2/A7/A8/A10)
 *   /privacy /terms /accessibility      legal          (A13)
 *
 * About/Reviews/Blog/Contact resolve for every tenant via the generated page
 * templates (see generated-pages.ts), so they are always surfaced. Services
 * and areas are derived and shown whenever the underlying data exists.
 */
import { servicesForNiche, slugify } from "@platform/blocks";
import type { ResolvedSite } from "./resolve-site";

export interface NavLink {
  label: string;
  href: string;
}

export interface ServicesMenu {
  label: string; // "Services"
  href: string; // "/services"
  items: NavLink[]; // niche services -> /services/<slug>
  viewAll: NavLink; // "View all services" -> /services
}

export interface AreasMenu {
  label: string; // "Areas"
  href: string; // "/areas"
  items: NavLink[]; // service areas -> /areas/<city>
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface FooterMeta {
  businessName: string;
  tagline?: string;
  phone?: string;
  email?: string;
  hours: { label: string; value: string }[];
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  licenseNumber?: string;
  insured?: boolean;
  socials: { platform: string; href: string }[];
  legalLinks: NavLink[]; // Privacy / Terms / Accessibility
  year: number;
}

export interface SiteNav {
  home: NavLink;
  /** Top-level page links present for this tenant (About, Reviews, Blog). */
  primary: NavLink[];
  services: ServicesMenu;
  areas?: AreasMenu;
  /** Primary conversion CTA shown in the header + mobile call bar. */
  cta: NavLink;
  /** Click-to-call number, when the tenant has supplied one. */
  phone?: string;
  footer: {
    columns: FooterColumn[];
    meta: FooterMeta;
  };
}

// Standard pages and their canonical paths. Every tenant gets these via the
// generated page templates (Phase 3), so they are always surfaced.
const STANDARD_PAGES = {
  about: { label: "About", href: "/about" },
  reviews: { label: "Reviews", href: "/reviews" },
  blog: { label: "Blog", href: "/blog" },
  contact: { label: "Contact", href: "/contact" },
} as const;

const SERVICES_INDEX = "/services";
const AREAS_HUB = "/areas";

const LEGAL_LINKS: NavLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
];


function serviceLinks(site: ResolvedSite): NavLink[] {
  return servicesForNiche(site.niche).map((s) => ({
    label: s.name,
    href: `${SERVICES_INDEX}/${s.slug}`,
  }));
}

function areaLinks(site: ResolvedSite): NavLink[] {
  return site.serviceAreas.map((a) => ({
    label: a.city,
    href: `${AREAS_HUB}/${slugify(a.city)}`,
  }));
}

export function buildSiteNav(site: ResolvedSite): SiteNav {
  const profile = site.profile;

  // Page-backed primary links, in display order, filtered to what exists.
  const primary = [
    STANDARD_PAGES.about,
    STANDARD_PAGES.reviews,
    STANDARD_PAGES.blog,
  ];

  const services: ServicesMenu = {
    label: "Services",
    href: SERVICES_INDEX,
    items: serviceLinks(site),
    viewAll: { label: "View all services", href: SERVICES_INDEX },
  };

  const areaItems = areaLinks(site);
  const areas: AreasMenu | undefined = areaItems.length
    ? { label: "Areas", href: AREAS_HUB, items: areaItems }
    : undefined;

  // Footer columns: derived (services, areas) + page-backed (company).
  const columns: FooterColumn[] = [];
  columns.push({
    title: "Services",
    links: [...services.items, services.viewAll],
  });
  if (areas) columns.push({ title: "Service Areas", links: areas.items });
  const companyLinks = [
    STANDARD_PAGES.about,
    STANDARD_PAGES.reviews,
    STANDARD_PAGES.blog,
    STANDARD_PAGES.contact,
  ];
  columns.push({ title: "Company", links: companyLinks });

  const footerMeta: FooterMeta = {
    businessName: site.businessName,
    tagline: profile?.tagline,
    phone: profile?.phone,
    email: profile?.email,
    hours: profile?.hours ?? [],
    address: profile?.address,
    licenseNumber: profile?.licenseNumber,
    insured: profile?.insured,
    socials: profile?.socials ?? [],
    legalLinks: LEGAL_LINKS,
    year: new Date().getFullYear(),
  };

  return {
    home: { label: "Home", href: "/" },
    primary,
    services,
    areas,
    cta: { label: "Get a Quote", href: STANDARD_PAGES.contact.href },
    phone: profile?.phone,
    footer: { columns, meta: footerMeta },
  };
}
