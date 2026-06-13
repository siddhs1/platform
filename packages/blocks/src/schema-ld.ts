/**
 * LocalBusiness / Service JSON-LD. Emitted on every page for local SEO.
 * Generated from tenant data — no per-site hand-authoring.
 */
export interface BusinessContext {
  name: string;
  niche: string;
  city: string;
  state: string;
}

export function localBusinessJsonLd(b: BusinessContext) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.name,
    areaServed: {
      "@type": "City",
      name: b.city,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: b.city,
      addressRegion: b.state,
      addressCountry: "US",
    },
    description: `${b.name} provides ${b.niche.toLowerCase()} services in ${b.city}, ${b.state}.`,
  };
}
