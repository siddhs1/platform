/**
 * Testimonials block. Three variants:
 *   carousel     — horizontal scroll-snap rail, swipeable on touch (default)
 *   wall         — multi-column grid of quote cards
 *   single-quote — one large featured pull-quote
 *
 * Quotes come from props.items when present, else a small built-in set
 * so a freshly seeded site still looks populated.
 */
import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow, tintedSurface } from "./shared";

interface Quote {
  body: string;
  author: string;
  detail?: string;
}

const DEFAULT_QUOTES: Quote[] = [
  {
    body: "Showed up on time, fair price, did exactly what they said they would.",
    author: "Marcus D.",
    detail: "Verified customer",
  },
  {
    body: "Honest crew. They walked me through every option and never upsold me.",
    author: "Priya R.",
    detail: "Verified customer",
  },
  {
    body: "Called in a panic on a Sunday and they were out the same afternoon.",
    author: "Tom B.",
    detail: "Emergency service",
  },
  {
    body: "Best in town, full stop. I've already sent two neighbors their way.",
    author: "Angela M.",
    detail: "Repeat customer",
  },
];

function Stars() {
  return (
    <div aria-label="5 out of 5 stars" style={{ color: "var(--color-accent)", letterSpacing: "2px" }}>
      {"★★★★★"}
    </div>
  );
}

const quoteCard: CSSProperties = {
  padding: "1.5rem",
  borderRadius: "var(--radius)",
  background: "var(--color-surface)",
  border: "1px solid color-mix(in srgb, var(--color-muted) 20%, transparent)",
};

function Attribution({ q }: { q: Quote }) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <strong style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}>
        {q.author}
      </strong>
      {q.detail ? (
        <span style={{ display: "block", color: "var(--color-muted)", fontSize: "0.85rem" }}>
          {q.detail}
        </span>
      ) : null}
    </div>
  );
}

registerBlock({
  type: "testimonials",
  variants: ["carousel", "wall", "single-quote"],
  render: (block: SiteBlock, _ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "What customers say";
    const quotes = (block.props.items as Quote[] | undefined) ?? DEFAULT_QUOTES;
    const variant = block.variant;

    if (variant === "wall") {
      return section(
        <>
          <p style={eyebrow}>Reviews</p>
          <h2 style={h2}>{heading}</h2>
          <div
            style={{
              marginTop: "1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {quotes.map((q) => (
              <figure key={q.author} style={{ ...quoteCard, margin: 0 }}>
                <Stars />
                <blockquote
                  style={{
                    margin: "0.75rem 0 0",
                    color: "var(--color-ink)",
                    fontSize: "1.02rem",
                    lineHeight: 1.5,
                  }}
                >
                  {q.body}
                </blockquote>
                <Attribution q={q} />
              </figure>
            ))}
          </div>
        </>,
        { background: tintedSurface }
      );
    }

    if (variant === "single-quote") {
      const q = quotes[0]!;
      return section(
        <div style={{ maxWidth: 760 }}>
          <p style={eyebrow}>Reviews</p>
          <Stars />
          <blockquote
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
              fontStyle: "italic",
              lineHeight: 1.3,
              color: "var(--color-ink)",
              borderLeft: "4px solid var(--color-accent)",
              paddingLeft: "1.5rem",
              margin: "1rem 0 0",
            }}
          >
            “{q.body}”
          </blockquote>
          <Attribution q={q} />
        </div>,
        { background: tintedSurface }
      );
    }

    // default: carousel — CSS scroll-snap rail
    const railId = "tst-rail";
    const railCss = `
.${railId} { scrollbar-width: thin; }
.${railId}::-webkit-scrollbar { height: 8px; }
.${railId}::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-muted) 40%, transparent);
  border-radius: 9999px;
}
@media (prefers-reduced-motion: no-preference) {
  .${railId} { scroll-behavior: smooth; }
}`;
    return section(
      <>
        <p style={eyebrow}>Reviews</p>
        <h2 style={h2}>{heading}</h2>
        <div
          className={railId}
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "minmax(280px, 360px)",
            gap: "1.25rem",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: "1rem",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {quotes.map((q) => (
            <figure
              key={q.author}
              style={{ ...quoteCard, margin: 0, scrollSnapAlign: "start" }}
            >
              <Stars />
              <blockquote
                style={{
                  margin: "0.75rem 0 0",
                  color: "var(--color-ink)",
                  fontSize: "1.05rem",
                  lineHeight: 1.5,
                }}
              >
                {q.body}
              </blockquote>
              <Attribution q={q} />
            </figure>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{ __html: railCss }} />
      </>
    );
  },
});
