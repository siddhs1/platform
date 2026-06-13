import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";

interface HeroProps {
  heading?: string;
  sub?: string;
  ctaLabel?: string;
}

const btn: CSSProperties = {
  display: "inline-block",
  padding: "calc(0.85rem * var(--density)) 1.6rem",
  borderRadius: "var(--radius)",
  background: "var(--color-brand)",
  color: "var(--color-surface)",
  fontWeight: 600,
  textDecoration: "none",
};

const wrap = (children: React.ReactNode, style?: CSSProperties): React.ReactNode => (
  <section
    style={{
      padding: "calc(4rem * var(--density)) 1.5rem",
      ...style,
    }}
  >
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
  </section>
);

function Heading({ heading, sub, ctaLabel }: HeroProps) {
  return (
    <>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
          lineHeight: 1.05,
          margin: 0,
          color: "var(--color-ink)",
        }}
      >
        {heading}
      </h1>
      {sub ? (
        <p
          style={{
            fontSize: "1.2rem",
            color: "var(--color-muted)",
            maxWidth: 560,
            marginTop: "1rem",
          }}
        >
          {sub}
        </p>
      ) : null}
      {ctaLabel ? (
        <a href="#contact" style={{ ...btn, marginTop: "1.5rem" }}>
          {ctaLabel}
        </a>
      ) : null}
    </>
  );
}

registerBlock({
  type: "hero",
  variants: ["image-right", "full-bleed", "video-bg"],
  render: (block: SiteBlock, _ctx: RenderContext) => {
    const p = block.props as HeroProps;
    switch (block.variant) {
      case "full-bleed":
        return wrap(
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
            <Heading {...p} />
          </div>,
          { background: "var(--color-brand)", color: "var(--color-surface)" }
        );
      case "video-bg":
        return wrap(
          <div style={{ maxWidth: 640 }}>
            <Heading {...p} />
          </div>,
          {
            background:
              "linear-gradient(135deg, var(--color-brand), var(--color-ink))",
            color: "var(--color-surface)",
          }
        );
      case "image-right":
      default:
        return wrap(
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: "2.5rem",
              alignItems: "center",
            }}
          >
            <div>
              <Heading {...p} />
            </div>
            <div
              style={{
                aspectRatio: "4 / 3",
                borderRadius: "var(--radius)",
                background:
                  "linear-gradient(135deg, var(--color-accent), var(--color-brand))",
              }}
              aria-hidden
            />
          </div>
        );
    }
  },
});
