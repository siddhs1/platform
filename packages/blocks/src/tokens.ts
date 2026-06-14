/**
 * Design tokens -- CSS custom properties. Every block reads only from
 * these variables, so changing a tenant's tokens restyles the whole site
 * with no code change. This is Layer 1 of the customization model.
 */
import type { CSSProperties } from "react";
import type { SiteTokens } from "@platform/db";

// Curated font pairings (display + body). The families are loaded once,
// document-wide, by next/font in apps/sites/src/app/fonts.ts, which exposes
// each as a `--f-<slug>` CSS variable. Here the stacks just point at those
// variables (with a system fallback so text still renders before the face
// loads, or if a family is ever removed).
//
// CONTRACT: every var(--f---) below must have a matching next/font instance
// in fonts.ts. Keep the two in sync when adding or removing a pairing.
export const FONT_PAIRS: Record<
  string,
  { display: string; body: string }
> = {
  // sans display + neutral sans - clean, modern, trades/contractor default
  "archivo-inter": {
    display: "var(--f-archivo), system-ui, sans-serif",
    body: "var(--f-inter), system-ui, sans-serif",
  },
  // warm serif + friendly sans - approachable, good for health/wellness
  "fraunces-nunito": {
    display: "var(--f-fraunces), Georgia, serif",
    body: "var(--f-nunito), system-ui, sans-serif",
  },
  // high-contrast serif + clean sans - elegant, hospitality/boutique
  "playfair-source": {
    display: "var(--f-playfair), Georgia, serif",
    body: "var(--f-source), system-ui, sans-serif",
  },
  // techy geometric display + neutral sans - modern services/tech-leaning
  "space-inter": {
    display: "var(--f-space), system-ui, sans-serif",
    body: "var(--f-inter), system-ui, sans-serif",
  },
  // readable serif + humanist sans - editorial, professional services
  "lora-worksans": {
    display: "var(--f-lora), Georgia, serif",
    body: "var(--f-work), system-ui, sans-serif",
  },
  // expressive grotesque display + neutral sans - distinctive, creative
  "bricolage-inter": {
    display: "var(--f-bricolage), system-ui, sans-serif",
    body: "var(--f-inter), system-ui, sans-serif",
  },
  // literary serif + clean geometric sans - calm, premium services
  "spectral-manrope": {
    display: "var(--f-spectral), Georgia, serif",
    body: "var(--f-manrope), system-ui, sans-serif",
  },
  // rounded geometric display + geometric sans - soft, friendly retail
  "sora-dmsans": {
    display: "var(--f-sora), system-ui, sans-serif",
    body: "var(--f-dmsans), system-ui, sans-serif",
  },
  // editorial display serif + geometric sans - upscale, restaurants/brands
  "dmserif-dmsans": {
    display: "var(--f-dmserif), Georgia, serif",
    body: "var(--f-dmsans), system-ui, sans-serif",
  },
  // Hanken Grotesk in both roles - humanist, friendly, trustworthy (public-site Trust Blue preset).
  "hanken-hanken": {
    display: "var(--f-hanken), system-ui, sans-serif",
    body: "var(--f-hanken), system-ui, sans-serif",
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
