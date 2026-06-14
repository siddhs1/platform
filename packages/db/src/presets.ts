/**
 * Theme presets - curated, reusable token sets (Layer 1).
 *
 * A preset is a SiteTokens value with an id + human label. Presets are the
 * single source of truth for "starter looks": the seed applies them to the
 * demo tenants, the internal theme gallery renders every block against each
 * one, and onboarding / the console "Site appearance" editor offer them as
 * one-click starting points. This module lives in @platform/db (the base
 * package that owns SiteTokens) so seed, the sites app, and the console can
 * all import it without creating a dependency cycle.
 *
 * CONTRACT: every `fontPair` below must exist in FONT_PAIRS
 * (packages/blocks/src/tokens.ts) and have a matching `--f-<slug>` next/font
 * instance in apps/sites/src/app/fonts.ts. Adding a preset that names a new
 * pairing means adding that pairing + face too.
 */
import type { SiteTokens } from "./types";

// The public-site reference design (see the "Platform Designs" canvas and
// WIREFRAMES Part A): Trust Blue chrome, Action Orange CTAs, near-black ink,
// Hanken Grotesk, soft 10-18px radii, always-reachable CTA, WCAG AA. Built
// token-driven; this preset reproduces that look on the generic system.
export const trustBlueTokens: SiteTokens = {
  colors: {
    brand: "#1D4ED8", // Trust Blue
    accent: "#EA580C", // Action Orange
    ink: "#0E1726",
    surface: "#FFFFFF",
    muted: "#475067",
  },
  fontPair: "hanken-hanken",
  radius: "soft",
  buttonStyle: "solid",
  density: "comfortable",
};

// Navy + amber, sharp corners - established trades/contractor (roofing demo).
export const slateTradesTokens: SiteTokens = {
  colors: {
    brand: "#1F3A5F",
    accent: "#E8A33D",
    ink: "#16202B",
    surface: "#FFFFFF",
    muted: "#5C6B7A",
  },
  fontPair: "archivo-inter",
  radius: "sharp",
  buttonStyle: "solid",
  density: "comfortable",
};

// Teal + rounded, airy - calm and clean for health/wellness (dental demo).
export const tealCareTokens: SiteTokens = {
  colors: {
    brand: "#0E8C8C",
    accent: "#7FD1C4",
    ink: "#1A2E2E",
    surface: "#F7FBFB",
    muted: "#6B8585",
  },
  fontPair: "fraunces-nunito",
  radius: "pill",
  buttonStyle: "soft",
  density: "spacious",
};

// Wine + gold, editorial serif - upscale hospitality/boutique (bistro demo).
export const wineHospitalityTokens: SiteTokens = {
  colors: {
    brand: "#7A2E2E",
    accent: "#D9A441",
    ink: "#2B1A12",
    surface: "#FBF6EE",
    muted: "#8A6F5C",
  },
  fontPair: "playfair-source",
  radius: "soft",
  buttonStyle: "outline",
  density: "comfortable",
};

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
  tokens: SiteTokens;
}

// Order matters: trust-blue is the flagship / default starter.
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "trust-blue",
    label: "Trust Blue",
    description:
      "Blue chrome builds trust, orange drives the action. Humanist sans, soft corners. Strong default for trades and home services.",
    tokens: trustBlueTokens,
  },
  {
    id: "slate-trades",
    label: "Slate Trades",
    description:
      "Navy and amber with sharp corners - a solid, established contractor feel.",
    tokens: slateTradesTokens,
  },
  {
    id: "teal-care",
    label: "Teal Care",
    description:
      "Soft teal, rounded, airy - calm and clean for health and wellness.",
    tokens: tealCareTokens,
  },
  {
    id: "wine-hospitality",
    label: "Wine & Gold",
    description:
      "Editorial serif in wine and gold - upscale hospitality and boutique retail.",
    tokens: wineHospitalityTokens,
  },
];

export const PRESETS_BY_ID: Record<string, ThemePreset> = Object.fromEntries(
  THEME_PRESETS.map((p) => [p.id, p])
);

/** Tokens for a preset id, falling back to the flagship Trust Blue. */
export function presetTokens(id: string): SiteTokens {
  return (PRESETS_BY_ID[id] ?? PRESETS_BY_ID["trust-blue"]!).tokens;
}
