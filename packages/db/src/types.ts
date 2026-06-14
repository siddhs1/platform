/**
 * Typed shapes for the JSONB config columns. These are the contract
 * between the database, the console editor, and the sites renderer.
 * Validated at the app boundary with Zod (see packages/config).
 */

// â”€â”€ L1: design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface SiteTokens {
  colors: {
    brand: string; // primary brand color, hex
    accent: string;
    ink: string; // body text
    surface: string; // page background
    muted: string;
  };
  // index into the curated font-pairing catalog (8-10 combos)
  fontPair: string; // e.g. "sohne-tiempos" | "space-inter" ...
  radius: "sharp" | "soft" | "pill";
  buttonStyle: "solid" | "outline" | "soft";
  density: "compact" | "comfortable" | "spacious";
}

// â”€â”€ L2: pages & blocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// A page is an ordered array of typed blocks. Each block names a type
// from the registry, a variant, and its props. The renderer maps over
// this; an unknown type renders nothing (never crashes the site).
export type BlockType =
  | "hero"
  | "services"
  | "testimonials"
  | "service-area"
  | "before-after"
  | "team"
  | "faq"
  | "cta-band"
  | "contact-form"
  | "reviews-feed"
  | "gallery"
  | "footer"
  | "trust-bar"
  | "why-us"
  | "story"
  | "stats"
  | "credentials"
  | "guarantee";

export interface SiteBlock {
  id: string; // stable id for reorder/edit
  type: BlockType;
  variant: string; // validated per-type in the registry
  props: Record<string, unknown>;
}

export interface SitePage {
  path: string; // "/", "/services/roof-repair", "/areas/tampa"
  title: string;
  meta: {
    description: string;
    // generated keyword pattern: "[Service] in [City] | [Business]"
    keywords?: string[];
  };
  blocks: SiteBlock[];
}

// â”€â”€ L4: feature flags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Gate custom blocks. Flag name â†’ enabled. A block whose type requires a
// flag only renders when the flag is true for that tenant.
export type FeatureFlags = Record<string, boolean>;

// â”€â”€ Change-request diff â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ConfigDiff {
  field: "tokens" | "pages" | "customCss" | "featureFlags";
  before: unknown;
  after: unknown;
}


// -- Service areas (per tenant) ----------------------------------------
// Cities a tenant serves. Used to generate per-service/per-city pages
// (/<service>/<city>) and /areas/<city> hubs from data, not hand-authoring.
export interface ServiceArea {
  city: string;
  state: string;
}

// -- Business profile (per tenant) -------------------------------------
// Contact / NAP / hours / licensing shown in site chrome (header + footer)
// and used to enrich LocalBusiness JSON-LD. All fields optional so chrome
// degrades gracefully when a tenant has not supplied them yet. Persisted on
// the tenants table (businessProfile jsonb); see resolve-site + seed.
export interface BusinessHours {
  label: string; // e.g. "Mon-Fri", "Sat"
  value: string; // e.g. "8 AM - 6 PM", "Closed"
}

export interface BusinessAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface SocialLink {
  platform: string; // "facebook" | "instagram" | "x" | "youtube" | ...
  href: string;
}

export interface BusinessProfile {
  tagline?: string;
  phone?: string; // display form, e.g. "(555) 123-4567"
  email?: string;
  address?: BusinessAddress;
  hours?: BusinessHours[];
  licenseNumber?: string;
  insured?: boolean;
  socials?: SocialLink[];
}
