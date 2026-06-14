/**
 * Before / after - shared style primitives (server-neutral, NO "use client").
 *
 * These are pure CSSProperties values/helpers with no state or browser APIs.
 * They must NOT live in the "use client" widgets module, because the static
 * "side-by-side" variant in before-after.tsx renders on the SERVER and calls
 * panelBg() / spreads tag + frame. Anything exported from a "use client" file
 * becomes a client reference when imported by a Server Component, so calling
 * it server-side throws ("... is on the client") in a production build.
 * Keeping these here lets BOTH the server registration (before-after.tsx) and
 * the client widgets (before-after-widgets.tsx) import them safely.
 */
import type { CSSProperties } from "react";

const panelBase: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

export function panelBg(url: string | undefined, which: "before" | "after"): CSSProperties {
  if (url) return { ...panelBase, backgroundImage: `url(${JSON.stringify(url)})` };
  // Placeholder gradients: muted/desaturated for "before", brand for "after".
  return {
    ...panelBase,
    background:
      which === "before"
        ? "linear-gradient(135deg, color-mix(in srgb, var(--color-muted) 55%, #888), color-mix(in srgb, var(--color-ink) 30%, #666))"
        : "linear-gradient(135deg, var(--color-accent), var(--color-brand))",
  };
}

export const tag: CSSProperties = {
  position: "absolute",
  top: "0.75rem",
  padding: "0.3rem 0.7rem",
  borderRadius: "var(--radius)",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  background: "color-mix(in srgb, var(--color-ink) 78%, transparent)",
  color: "var(--color-surface)",
  pointerEvents: "none",
};

export const frame: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 10",
  borderRadius: "var(--radius)",
  overflow: "hidden",
  marginTop: "1.5rem",
  userSelect: "none",
};
