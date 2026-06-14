/**
 * Reviews-feed block. Distinct from testimonials: this one foregrounds the
 * aggregate rating and platform provenance (Google/Yelp/Facebook) - the
 * social-proof numbers, not just pull-quotes. Later this is fed by a real
 * reviews integration; for now it renders from props/defaults.
 *   stars-summary - big average rating + count + recent quotes (default)
 *   cards         - individual review cards with platform + date
 *   badges        - compact platform rating badges in a row
 *
 * props: { rating, count, platform, items: {author, rating, body, date, platform}[] }
 */
import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow, tintedSurface } from "./shared";

interface Review {
  author: string;
  rating: number;
  body: string;
  date?: string;
  platform?: string;
}

interface RFProps {
  heading?: string;
  rating?: number;
  count?: number;
  platform?: string;
  items?: Review[];
}

const DEFAULT_REVIEWS: Review[] = [
  { author: "Marcus D.", rating: 5, body: "On time, fair, and the work was spotless. Couldn't ask for more.", date: "2 weeks ago", platform: "Google" },
  { author: "Priya R.", rating: 5, body: "Explained everything clearly and stuck to the quote. Highly recommend.", date: "1 month ago", platform: "Google" },
  { author: "Tom B.", rating: 5, body: "Came out same day for an emergency. Lifesavers.", date: "1 month ago", platform: "Yelp" },
  { author: "Angela M.", rating: 4, body: "Great service overall, would use again without hesitation.", date: "2 months ago", platform: "Facebook" },
];

function StarRow({ n, size = "1rem" }: { n: number; size?: string }) {
  const full = Math.round(n);
  return (
    <span aria-label={`${n} out of 5 stars`} style={{ color: "var(--color-accent)", fontSize: size, letterSpacing: "1px" }}>
      {"*".repeat(full)}
      <span style={{ color: "color-mix(in srgb, var(--color-muted) 40%, transparent)" }}>
        {"*".repeat(Math.max(0, 5 - full))}
      </span>
    </span>
  );
}

const reviewCard: CSSProperties = {
  padding: "1.25rem",
  borderRadius: "var(--radius)",
  background: "var(--color-surface)",
  border: "1px solid color-mix(in srgb, var(--color-muted) 20%, transparent)",
};

registerBlock({
  type: "reviews-feed",
  variants: ["stars-summary", "cards", "badges"],
  render: (block: SiteBlock, _ctx: RenderContext) => {
    const p = block.props as RFProps;
    const items = p.items ?? DEFAULT_REVIEWS;
    const rating = p.rating ?? 4.9;
    const count = p.count ?? 127;
    const heading = p.heading ?? "Rated by your neighbors";

    if (block.variant === "cards") {
      return section(
        <>
          <p style={eyebrow}>Reviews</p>
          <h2 style={h2}>{heading}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
              marginTop: "1.5rem",
            }}
          >
            {items.map((r) => (
              <div key={r.author} style={reviewCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <StarRow n={r.rating} />
                  {r.platform ? (
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-muted)" }}>
                      {r.platform}
                    </span>
                  ) : null}
                </div>
                <p style={{ margin: "0.6rem 0 0", color: "var(--color-ink)", lineHeight: 1.5 }}>{r.body}</p>
                <p style={{ margin: "0.75rem 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  {r.author}
                  {r.date ? ` - ${r.date}` : ""}
                </p>
              </div>
            ))}
          </div>
        </>,
        { background: tintedSurface }
      );
    }

    if (block.variant === "badges") {
      // Aggregate per platform from items, falling back to a sensible set.
      const platforms = ["Google", "Yelp", "Facebook"];
      return section(
        <>
          <p style={eyebrow}>Reviews</p>
          <h2 style={h2}>{heading}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1.5rem" }}>
            {platforms.map((plat) => {
              const subset = items.filter((r) => r.platform === plat);
              const avg =
                subset.length > 0
                  ? subset.reduce((s, r) => s + r.rating, 0) / subset.length
                  : rating;
              return (
                <div
                  key={plat}
                  style={{
                    ...reviewCard,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.9rem",
                    minWidth: 200,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "var(--color-brand)",
                      lineHeight: 1,
                    }}
                  >
                    {avg.toFixed(1)}
                  </div>
                  <div>
                    <StarRow n={avg} />
                    <div style={{ fontSize: "0.82rem", color: "var(--color-muted)", marginTop: 2 }}>
                      on {plat}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    // default: stars-summary
    return section(
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 280px) 1fr",
          gap: "2.5rem",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "4rem",
              fontWeight: 800,
              color: "var(--color-brand)",
              lineHeight: 1,
            }}
          >
            {rating.toFixed(1)}
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <StarRow n={rating} size="1.4rem" />
          </div>
          <p style={{ color: "var(--color-muted)", marginTop: "0.5rem" }}>
            {count}+ reviews
          </p>
        </div>
        <div style={{ display: "grid", gap: "1rem" }}>
          <p style={eyebrow}>Reviews</p>
          <h2 style={{ ...h2, marginTop: "-0.5rem" }}>{heading}</h2>
          {items.slice(0, 2).map((r) => (
            <blockquote
              key={r.author}
              style={{
                margin: 0,
                paddingLeft: "1rem",
                borderLeft: "3px solid var(--color-accent)",
                color: "var(--color-ink)",
              }}
            >
              {r.body}
              <footer style={{ color: "var(--color-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                - {r.author}
                {r.platform ? `, ${r.platform}` : ""}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>,
      { background: tintedSurface }
    );
  },
});
