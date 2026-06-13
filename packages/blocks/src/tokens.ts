/**
 * Design tokens → CSS custom properties. Every block reads only from
 * these variables, so changing a tenant's tokens restyles the whole site
 * with no code change. This is Layer 1 of the customization model.
 */
import type { CSSProperties } from "react";
import type { SiteTokens } from "@platform/db";

// Curated font pairings (8-10). Each maps a display + body family.
// Loaded via next/font in the app; here we only name the CSS stacks.
export const FONT_PAIRS: Record<
  string,
  { display: string; body: string }
> = {
  "archivo-inter": {
    display: '"Archivo", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },
  "fraunces-nunito": {
    display: '"Fraunces", Georgia, serif',
    body: '"Nunito Sans", system-ui, sans-serif',
  },
  "playfair-source": {
    display: '"Playfair Display", Georgia, serif',
    body: '"Source Sans 3", system-ui, sans-serif',
  },
  "space-inter": {
    display: '"Space Grotesk", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },
  "sohne-tiempos": {
    display: '"Tiempos Headline", Georgia, serif',
    body: '"Söhne", system-ui, sans-serif',
  },
};

const RADIUS: Record<SiteTokens["radius"], string> = {
  sharp: "0px",
  soft: "10px",
  pill: "9999px",
};

const DENSITY: Record<SiteTokens["density"], string> = {
  compact: "0.75",
  comfortable: "1",
  spacious: "1.35",
};

export function tokensToCssVars(tokens: SiteTokens): CSSProperties {
  const pair = FONT_PAIRS[tokens.fontPair] ?? FONT_PAIRS["space-inter"]!;
  return {
    "--color-brand": tokens.colors.brand,
    "--color-accent": tokens.colors.accent,
    "--color-ink": tokens.colors.ink,
    "--color-surface": tokens.colors.surface,
    "--color-muted": tokens.colors.muted,
    "--font-display": pair.display,
    "--font-body": pair.body,
    "--radius": RADIUS[tokens.radius],
    "--density": DENSITY[tokens.density],
    "--btn-style": tokens.buttonStyle,
    backgroundColor: "var(--color-surface)",
    color: "var(--color-ink)",
    fontFamily: "var(--font-body)",
  } as CSSProperties;
}
