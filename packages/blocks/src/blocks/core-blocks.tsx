import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";

const section = (children: React.ReactNode, style?: CSSProperties) => (
  <section style={{ padding: "calc(3.5rem * var(--density)) 1.5rem", ...style }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
  </section>
);

const h2: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
  color: "var(--color-ink)",
  marginTop: 0,
};

const btn: CSSProperties = {
  display: "inline-block",
  padding: "0.85rem 1.6rem",
  borderRadius: "var(--radius)",
  background: "var(--color-brand)",
  color: "var(--color-surface)",
  fontWeight: 600,
  textDecoration: "none",
};

// ── Services ─────────────────────────────────────────────────────────
registerBlock({
  type: "services",
  variants: ["cards", "list", "icon-grid"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "Our services";
    const items = [
      `${ctx.business.niche} repair`,
      `${ctx.business.niche} installation`,
      "Emergency service",
    ];
    return section(
      <>
        <h2 style={h2}>{heading}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              block.variant === "list"
                ? "1fr"
                : "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginTop: "1.5rem",
          }}
        >
          {items.map((it) => (
            <div
              key={it}
              style={{
                padding: "1.5rem",
                borderRadius: "var(--radius)",
                border: "1px solid color-mix(in srgb, var(--color-muted) 25%, transparent)",
                background: "var(--color-surface)",
              }}
            >
              <h3 style={{ margin: "0 0 0.5rem", color: "var(--color-ink)" }}>
                {it}
              </h3>
              <p style={{ margin: 0, color: "var(--color-muted)" }}>
                Professional, licensed, and insured.
              </p>
            </div>
          ))}
        </div>
      </>
    );
  },
});

// ── Testimonials ─────────────────────────────────────────────────────
registerBlock({
  type: "testimonials",
  variants: ["carousel", "wall", "single-quote"],
  render: (block: SiteBlock) => {
    const heading = (block.props.heading as string) ?? "What customers say";
    return section(
      <>
        <h2 style={h2}>{heading}</h2>
        <blockquote
          style={{
            fontSize: "1.3rem",
            fontStyle: "italic",
            color: "var(--color-ink)",
            borderLeft: "3px solid var(--color-accent)",
            paddingLeft: "1.25rem",
            margin: "1.5rem 0 0",
          }}
        >
          “Showed up on time, fair price, did exactly what they said.”
        </blockquote>
      </>,
      { background: "color-mix(in srgb, var(--color-muted) 8%, var(--color-surface))" }
    );
  },
});

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
// Posts to the console lead-intake API; on the public site this is a
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
