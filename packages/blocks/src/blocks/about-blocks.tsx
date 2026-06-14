/**
 * About-page content blocks (Phase 2): story, stats, credentials, guarantee.
 * Self-populate from the business context; token-driven; static/AA.
 * credentials + guarantee are also used on money pages.
 */
import type { CSSProperties, ReactNode } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow, card, tintedSurface } from "./shared";

function ShieldCheck({ color = "var(--color-brand)", size = 22 }: { color?: string; size?: number }): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// -- Story: prose / rich-text section ----------------------------------
registerBlock({
  type: "story",
  variants: ["prose"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const { name, niche, city, state } = ctx.business;
    const nicheLower = niche.toLowerCase();
    const heading = (block.props.heading as string) ?? `About ${name}`;
    const propBody = block.props.body as string | string[] | undefined;
    const paragraphs: string[] = Array.isArray(propBody)
      ? propBody
      : typeof propBody === "string"
        ? [propBody]
        : [
            `${name} has proudly served ${city}, ${state} and the surrounding communities for years. What began as a small local ${nicheLower} has grown into a name your neighbors trust - built one honest job at a time.`,
            `We believe in doing the work right the first time: quality craftsmanship, straightforward pricing, and treating every property like it were our own. Our team is fully licensed, insured, and focused on the kind of service that earns repeat customers and word-of-mouth referrals.`,
            `From your first call to the final walkthrough, we keep the process simple and the communication clear - so you always know what to expect.`,
          ];
    const para: CSSProperties = { color: "var(--color-ink)", fontSize: "1.05rem", lineHeight: 1.7, margin: "0 0 1rem" };
    return section(
      <div style={{ maxWidth: 720 }}>
        <p style={eyebrow}>Our story</p>
        <h2 style={h2}>{heading}</h2>
        <div style={{ marginTop: "1.25rem" }}>
          {paragraphs.map((t, i) => (
            <p key={i} style={para}>{t}</p>
          ))}
        </div>
      </div>
    );
  },
});

// -- Stats: metric cards -----------------------------------------------
interface Metric {
  value: string;
  label: string;
}
const STAT_DEFAULTS: Metric[] = [
  { value: "20+", label: "Years in business" },
  { value: "2,500+", label: "Projects completed" },
  { value: "4.9*", label: "Average rating" },
  { value: "< 24h", label: "Typical response" },
];

registerBlock({
  type: "stats",
  variants: ["cards"],
  render: (block: SiteBlock) => {
    const items = (block.props.items as Metric[] | undefined) ?? STAT_DEFAULTS;
    const heading = block.props.heading as string | undefined;
    return section(
      <>
        {heading ? <h2 style={{ ...h2, textAlign: "center", marginBottom: "1.75rem" }}>{heading}</h2> : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
          {items.map((m, i) => (
            <div key={i} style={{ ...card, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, color: "var(--color-brand)", lineHeight: 1 }}>
                {m.value}
              </div>
              <div style={{ color: "var(--color-muted)", marginTop: "0.5rem", fontSize: "0.95rem" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </>,
      { background: tintedSurface }
    );
  },
});

// -- Credentials: license / insurance / cert badges --------------------
interface Credential {
  label: string;
  sub?: string;
}

registerBlock({
  type: "credentials",
  variants: ["badges"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "Credentials & trust";
    const items: Credential[] =
      (block.props.items as Credential[] | undefined) ?? [
        { label: "Licensed", sub: `${ctx.business.state} contractor` },
        { label: "Insured", sub: "Liability & workers' comp" },
        { label: "Background-checked", sub: "Every technician" },
        { label: "Accredited", sub: "A+ rated, local" },
      ];
    return section(
      <>
        <p style={eyebrow}>Credentials</p>
        <h2 style={h2}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
          {items.map((c, i) => (
            <div key={i} style={{ ...card, display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <span
                aria-hidden
                style={{ width: 42, height: 42, flex: "none", borderRadius: "999px", background: "color-mix(in srgb, var(--color-brand) 12%, var(--color-surface))", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                <ShieldCheck size={22} />
              </span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--color-ink)" }}>{c.label}</div>
                {c.sub ? <div style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>{c.sub}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  },
});

// -- Guarantee: warranty / satisfaction callout ------------------------
registerBlock({
  type: "guarantee",
  variants: ["banner"],
  render: (block: SiteBlock) => {
    const heading = (block.props.heading as string) ?? "Our satisfaction guarantee";
    const body =
      (block.props.body as string) ??
      "If you are not completely happy with our work, we will make it right - that is our promise to every customer, on every job.";
    return section(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
          padding: "calc(2rem * var(--density))",
          borderRadius: "var(--radius)",
          background: "color-mix(in srgb, var(--color-brand) 8%, var(--color-surface))",
          border: "1px solid color-mix(in srgb, var(--color-brand) 30%, transparent)",
        }}
      >
        <span
          aria-hidden
          style={{ width: 64, height: 64, flex: "none", borderRadius: "999px", background: "color-mix(in srgb, var(--color-accent) 14%, var(--color-surface))", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <ShieldCheck color="var(--color-accent)" size={34} />
        </span>
        <div style={{ flex: "1 1 300px" }}>
          <h2 style={{ ...h2, fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", margin: 0 }}>{heading}</h2>
          <p style={{ margin: "0.5rem 0 0", color: "var(--color-ink)", fontSize: "1.05rem", lineHeight: 1.6, opacity: 0.85 }}>{body}</p>
        </div>
      </div>
    );
  },
});
