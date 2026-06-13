import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, btn } from "./shared";

// NOTE: services and testimonials moved to their own files in Week 2
// (services.tsx, testimonials.tsx) when they grew to three variants each.
// This file now holds the smaller, single-purpose blocks.

// ── CTA band ─────────────────────────────────────────────────────────
registerBlock({
  type: "cta-band",
  variants: ["default"],
  render: (block: SiteBlock) =>
    section(
      <div style={{ textAlign: "center" }}>
        <h2 style={{ ...h2, color: "var(--color-surface)" }}>
          {(block.props.heading as string) ?? "Ready to start?"}
        </h2>
        <a href="#contact" style={{ ...btn, background: "var(--color-accent)", marginTop: "1rem" }}>
          {(block.props.ctaLabel as string) ?? "Get in touch"}
        </a>
      </div>,
      { background: "var(--color-brand)" }
    ),
});

// ── Contact form ─────────────────────────────────────────────────────
// Posts to the public lead-intake API; on the public site this is a
// plain HTML form (progressive enhancement happens later).
registerBlock({
  type: "contact-form",
  variants: ["split", "stacked"],
  render: (block: SiteBlock, ctx: RenderContext) =>
    section(
      <div id="contact">
        <h2 style={h2}>{(block.props.heading as string) ?? "Contact us"}</h2>
        <form
          method="post"
          action={`/api/lead?tenant=${ctx.business.name}`}
          style={{
            display: "grid",
            gap: "0.85rem",
            maxWidth: 480,
            marginTop: "1.25rem",
          }}
        >
          <input name="name" placeholder="Your name" required style={field} />
          <input name="phone" placeholder="Phone" required style={field} />
          <input name="email" type="email" placeholder="Email" style={field} />
          <textarea name="message" placeholder="How can we help?" rows={4} style={field} />
          <button type="submit" style={btn}>
            Request a quote
          </button>
        </form>
      </div>
    ),
});

const field: CSSProperties = {
  padding: "0.75rem 0.9rem",
  borderRadius: "var(--radius)",
  border: "1px solid color-mix(in srgb, var(--color-muted) 35%, transparent)",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
};

// ── Footer ───────────────────────────────────────────────────────────
registerBlock({
  type: "footer",
  variants: ["default"],
  render: (_block: SiteBlock, ctx: RenderContext) => (
    <footer
      style={{
        padding: "2.5rem 1.5rem",
        background: "var(--color-ink)",
        color: "var(--color-surface)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <strong style={{ fontFamily: "var(--font-display)" }}>
          {ctx.business.name}
        </strong>
        <p style={{ opacity: 0.7, marginTop: "0.5rem" }}>
          {ctx.business.niche} in {ctx.business.city}, {ctx.business.state}
        </p>
      </div>
    </footer>
  ),
});
