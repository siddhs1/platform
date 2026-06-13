/**
 * Niche-derived service catalog + slug helper. Single source of truth for
 * the per-service/per-city page generation AND the services block defaults,
 * so a tenant's service list and its generated /<service>/<city> URLs stay
 * in sync without hand-authoring.
 *
 * Pure module (no React) — safe to import from the sites app's routing
 * layer as well as from blocks.
 */

/** URL-safe slug: lowercase, non-alphanumerics -> single hyphen, trimmed. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface ServiceDef {
  slug: string;
  name: string;
  blurb: string;
}

/**
 * The default services for a niche. Names/blurbs match what the services
 * block has always rendered (so homepages don't change); each now also
 * carries a stable slug used to build /<service>/<city> money pages.
 */
export function servicesForNiche(niche: string): ServiceDef[] {
  const singular = niche.replace(/s$/, "");
  const defs: Omit<ServiceDef, "slug">[] = [
    {
      name: `${singular} repair`,
      blurb:
        "Fast, reliable fixes that hold up — diagnosed right the first time.",
    },
    {
      name: `${singular} installation`,
      blurb: "New systems sized and fitted to your property, built to last.",
    },
    {
      name: "Emergency service",
      blurb:
        "Same-day response when something can't wait. We pick up the phone.",
    },
    {
      name: "Maintenance plans",
      blurb: "Scheduled upkeep that prevents the expensive surprises.",
    },
  ];
  return defs.map((d) => ({ ...d, slug: slugify(d.name) }));
}

/** Look up one service by slug for a niche (used when resolving a money page). */
export function findServiceBySlug(
  niche: string,
  slug: string
): ServiceDef | undefined {
  return servicesForNiche(niche).find((s) => s.slug === slug);
}
