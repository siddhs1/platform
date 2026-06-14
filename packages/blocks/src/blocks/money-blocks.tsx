/**
 * Money-page blocks (Phase 2): lead-hero, process, included.
 * The page templates pass page-specific copy (e.g. "Roof Repair in Tampa");
 * with empty props they self-populate from the business niche so the gallery
 * still renders them. Token-driven, static, AA. The lead form posts to the
 * same public /api/lead endpoint the contact-form block uses.
 */
import type { CSSProperties, ReactNode } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow, btn } from "./shared";

const field: CSSProperties = {
  padding: "0.75rem 0.9rem",
  borderRadius: "var(--radius)",
  border: "1px solid color-mix(in srgb, var(--color-muted) 35%, transparent)",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  width: "100%",
  boxSizing: "border-box",
};

function Check({ color = "var(--color-brand)", size = 18 }: { color?: string; size?: number }): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ── Lead hero: headline + trust points + inline lead form ─────────────
interface LeadHeroProps {
  heading?: string;
  sub?: string;
  ctaLabel?: string;
  formTitle?: string;
  bullets?: string[];
}

registerBlock({
  type: "lead-hero",
  variants: ["split"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const p = block.props as LeadHeroProps;
    const nicheLower = ctx.business.niche.toLowerCase();
    const heading = p.heading ?? `Get your free ${nicheLower} quote`;
    const sub = p.sub ?? "Fast response, upfront pricing, and work that is licensed, insured, and guaranteed.";
    const ctaLabel = p.ctaLabel ?? "Get my free quote";
    const formTitle = p.formTitle ?? "Request a free quote";
    const bullets = p.bullets ?? ["Free, no-obligation estimate", "Licensed & fully insured", "Same-day response available"];
    return (
      <section style={{ padding: "calc(3.5rem * var(--density)) 1.5rem", background: "linear-gradient(135deg, var(--color-brand), var(--color-ink))" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
          <div style={{ color: "var(--color-surface)" }}>
            <p style={{ ...eyebrow, color: "color-mix(in srgb, var(--color-surface) 80%, transparent)" }}>{ctx.business.niche}</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.08, margin: 0 }}>{heading}</h1>
            <p style={{ fontSize: "1.15rem", marginTop: "1rem", opacity: 0.9, maxWidth: 480 }}>{sub}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0", display: "grid", gap: "0.6rem" }}>
              {bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "center", fontSize: "1rem" }}>
                  <Check color="var(--color-surface)" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <div id="contact" style={{ background: "var(--color-surface)", borderRadius: "var(--radius)", padding: "calc(1.75rem * var(--density))", boxShadow: "0 24px 60px -28px rgba(0,0,0,.55)" }}>
            <h2 style={{ ...h2, fontSize: "1.3rem", margin: "0 0 1rem" }}>{formTitle}</h2>
            <form method="post" action={`/api/lead?tenant=${ctx.business.name}`} style={{ display: "grid", gap: "0.8rem" }}>
              <input name="name" placeholder="Your name" required style={field} />
              <input name="phone" placeholder="Phone" required style={field} />
              <input name="email" type="email" placeholder="Email" style={field} />
              <textarea name="message" placeholder="Briefly, what do you need?" rows={3} style={field} />
              <button type="submit" style={{ ...btn, background: "var(--color-accent)" }}>{ctaLabel}</button>
            </form>
          </div>
        </div>
      </section>
    );
  },
});

// ── Process: "what happens next" numbered steps ───────────────────────
interface Step {
  title: string;
  body: string;
}
const STEP_DEFAULTS: Step[] = [
  { title: "Request your quote", body: "Tell us what you need — call or send the form. It takes about two minutes." },
  { title: "Get a clear estimate", body: "We assess the work and give you an upfront, written price. No pressure." },
  { title: "We do the work", body: "Our licensed team completes the job on schedule, cleanly and correctly." },
  { title: "Enjoy the results", body: "We walk you through everything and stand behind the work, guaranteed." },
];

registerBlock({
  type: "process",
  variants: ["steps"],
  render: (block: SiteBlock) => {
    const heading = (block.props.heading as string) ?? "What to expect";
    const steps = (block.props.steps as Step[] | undefined) ?? STEP_DEFAULTS;
    return section(
      <>
        <h2 style={{ ...h2, textAlign: "center" }}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.75rem", marginTop: "2rem" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "999px", background: "var(--color-brand)", color: "var(--color-surface)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: "0.85rem" }}>
                {i + 1}
              </div>
              <h3 style={{ margin: "0 0 0.4rem", fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--color-ink)" }}>{s.title}</h3>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.95rem", lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </>
    );
  },
});

// ── Included: what's-included checklist ───────────────────────────────
const INCLUDED_DEFAULTS: string[] = [
  "Upfront, written pricing",
  "Licensed & insured technicians",
  "Quality materials and workmanship",
  "Thorough cleanup when we are done",
  "Workmanship guarantee",
  "Honest, no-pressure recommendations",
];

registerBlock({
  type: "included",
  variants: ["checklist"],
  render: (block: SiteBlock) => {
    const heading = (block.props.heading as string) ?? "What is included";
    const items = (block.props.items as string[] | undefined) ?? INCLUDED_DEFAULTS;
    return section(
      <>
        <p style={eyebrow}>Included</p>
        <h2 style={h2}>{heading}</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.85rem 1.5rem" }}>
          {items.map((it, i) => (
            <li key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start", color: "var(--color-ink)", fontSize: "1rem", lineHeight: 1.5 }}>
              <span style={{ flex: "none", marginTop: "0.15rem" }}>
                <Check />
              </span>
              {it}
            </li>
          ))}
        </ul>
      </>
    );
  },
});
