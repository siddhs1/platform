/**
 * Typed shapes for the JSONB config columns. These are the contract
 * between the database, the console editor, and the sites renderer.
 * Validated at the app boundary with Zod (see packages/config).
 */

// ── L1: design tokens ────────────────────────────────────────────────
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

// ── L2: pages & blocks ───────────────────────────────────────────────
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
  | "footer";

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

// ── L4: feature flags ────────────────────────────────────────────────
// Gate custom blocks. Flag name → enabled. A block whose type requires a
// flag only renders when the flag is true for that tenant.
export type FeatureFlags = Record<string, boolean>;

// ── Change-request diff ──────────────────────────────────────────────
export interface ConfigDiff {
  field: "tokens" | "pages" | "customCss" | "featureFlags";
  before: unknown;
  after: unknown;
}
