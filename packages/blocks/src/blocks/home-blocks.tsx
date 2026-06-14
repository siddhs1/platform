/**
 * Home-page content blocks (Phase 2): trust-bar and why-us.
 *
 * Both self-populate from the business niche/context so they render fully
 * with empty props (the gallery and the page templates rely on this). All
 * colour/spacing comes from the L1 token CSS vars, so they restyle per
 * tenant. Static server output, no motion — AA by construction.
 */
import type { CSSProperties, ReactNode } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow, card, tintedSurface } from "./shared";

// A small brand-tinted check tile reused by the feature grid.
function CheckTile(): ReactNode {
  return (
    <span
      aria-hidden
      style={{
        width: 40,
        height: 40,
        flex: "none",
        borderRadius: "var(--radius)",
        background: "color-mix(in srgb, var(--color-brand) 12%, var(--color-surface))",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

// ── Trust bar: a stat/credential strip under the hero ─────────────────
interface Stat {
  value: string;
  label: string;
}
const TRUST_DEFAULTS: Stat[] = [
  { value: "20+", label: "Years of experience" },
  { value: "2,500+", label: "Jobs completed" },
  { value: "4.9★", label: "Average review" },
  { value: "Licensed", label: "& fully insured" },
];

registerBlock({
  type: "trust-bar",
  variants: ["stats"],
  render: (block: SiteBlock) => {
    const items = (block.props.items as Stat[] | undefined) ?? TRUST_DEFAULTS;
    return (
      <section
        style={{
          padding: "calc(1.85rem * var(--density)) 1.5rem",
          background: tintedSurface,
          borderTop: "1px solid color-mix(in srgb, var(--color-muted) 18%, transparent)",
          borderBottom: "1px solid color-mix(in srgb, var(--color-muted) 18%, transparent)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1.25rem",
            textAlign: "center",
          }}
        >
          {items.map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "var(--color-brand)", lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-muted)", marginTop: "0.3rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    );
  },
});

// ── Why-us: value-prop / icon-feature grid ────────────────────────────
interface Feature {
  title: string;
  body: string;
}
const WHYUS_DEFAULTS: Feature[] = [
  { title: "Upfront pricing", body: "You approve a clear, written quote before any work begins — no surprises." },
  { title: "On time, every time", body: "We respect your schedule and show up in the window we promise." },
  { title: "Licensed & insured", body: "Fully credentialed and covered, for your protection and peace of mind." },
  { title: "Satisfaction guaranteed", body: "We are not finished until you are happy with the result." },
];

registerBlock({
  type: "why-us",
  variants: ["icon-grid"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? `Why choose ${ctx.business.name}`;
    const items = (block.props.items as Feature[] | undefined) ?? WHYUS_DEFAULTS;
    const titleStyle: CSSProperties = { margin: "0 0 0.4rem", fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--color-ink)" };
    return section(
      <>
        <p style={eyebrow}>Why us</p>
        <h2 style={h2}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginTop: "1.75rem" }}>
          {items.map((f, i) => (
            <div key={i} style={card}>
              <div style={{ marginBottom: "0.9rem" }}>
                <CheckTile />
              </div>
              <h3 style={titleStyle}>{f.title}</h3>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.95rem", lineHeight: 1.55 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </>
    );
  },
});
