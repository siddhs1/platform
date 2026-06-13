/**
 * Shared layout + style primitives for blocks. Extracted so every block
 * file reads from the same section wrapper, button, and heading styles
 * instead of redefining them. Everything resolves from CSS variables
 * (the L1 token layer), so changing a tenant's tokens restyles all blocks.
 */
import type { CSSProperties, ReactNode } from "react";

export const section = (children: ReactNode, style?: CSSProperties): ReactNode => (
  <section style={{ padding: "calc(3.5rem * var(--density)) 1.5rem", ...style }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
  </section>
);

export const h2: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
  color: "var(--color-ink)",
  marginTop: 0,
};

export const eyebrow: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-brand)",
  margin: "0 0 0.5rem",
};

export const lead: CSSProperties = {
  fontSize: "1.1rem",
  color: "var(--color-muted)",
  maxWidth: 620,
  marginTop: "0.75rem",
};

export const btn: CSSProperties = {
  display: "inline-block",
  padding: "0.85rem 1.6rem",
  borderRadius: "var(--radius)",
  background: "var(--color-brand)",
  color: "var(--color-surface)",
  fontWeight: 600,
  textDecoration: "none",
};

export const card: CSSProperties = {
  padding: "1.5rem",
  borderRadius: "var(--radius)",
  border: "1px solid color-mix(in srgb, var(--color-muted) 25%, transparent)",
  background: "var(--color-surface)",
};

// A faint surface tint used for alternating section backgrounds.
export const tintedSurface =
  "color-mix(in srgb, var(--color-muted) 8%, var(--color-surface))";
