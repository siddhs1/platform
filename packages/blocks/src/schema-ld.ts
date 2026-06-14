/**
 * LocalBusiness / Service JSON-LD. Emitted on every page for local SEO.
 * Generated from tenant data - no per-site hand-authoring.
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

/**
 * Service schema for a generated /<service>/<city> money page. Ties a
 * specific service to the city it's offered in and back to the provider,
 * which is the structured-data signal that complements the on-page H1.
 */
export function serviceJsonLd(args: {
  business: string;
  service: string;
  city: string;
  state: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: args.service,
    name: `${args.service} in ${args.city}`,
    areaServed: {
      "@type": "City",
      name: args.city,
    },
    provider: {
      "@type": "LocalBusiness",
      name: args.business,
      address: {
        "@type": "PostalAddress",
        addressLocality: args.city,
        addressRegion: args.state,
        addressCountry: "US",
      },
    },
  };
}
