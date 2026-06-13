/**
 * Services block. Three variants:
 *   cards     — bordered cards in a responsive grid (default)
 *   list      — single-column rows with a leading rule, scannable
 *   icon-grid — compact tiles with a glyph mark, denser
 *
 * Items are derived from the tenant's niche (via servicesForNiche, the
 * shared catalog) so the block reads as authored even before a VA edits
 * copy. An item may carry an optional `href` — used by generated city/
 * service pages to link each service to its /<service>/<city> page.
 * Subtle lift-on-hover; disabled under prefers-reduced-motion.
 */
import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { servicesForNiche } from "../niche";
import { section, h2, eyebrow, card } from "./shared";

interface ServiceItem {
  title: string;
  body: string;
  href?: string;
}

function defaultItems(niche: string): ServiceItem[] {
  // Names/blurbs come from the shared catalog so they stay in sync with
  // the slugs used for /<service>/<city> page generation.
  return servicesForNiche(niche).map((s) => ({ title: s.name, body: s.blurb }));
}

// Render a card/list/tile title, as a link when the item has an href.
function Title({ item, style }: { item: ServiceItem; style?: CSSProperties }) {
  if (item.href) {
    return (
      <a href={item.href} style={{ color: "inherit", textDecoration: "none" }}>
        {item.title}
      </a>
    );
  }
  return <>{item.title}</>;
}

// One small glyph per tile for the icon-grid variant. Inline SVG keeps
// the block self-contained (no icon dependency in the renderer).
function Glyph({ i }: { i: number }) {
  const paths = [
    "M12 2 3 7v10l9 5 9-5V7z", // shield
    "m12 2 2.4 7.4H22l-6 4.4 2.3 7.2-6.3-4.6L5.7 21l2.3-7.2-6-4.4h7.6z", // star
    "M4 13a8 8 0 0 1 16 0M12 3v2m0 14v2", // arc
    "M3 12h4l3-8 4 16 3-8h4", // pulse
  ];
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-brand)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[i % paths.length]} />
    </svg>
  );
}

const styleId = "svc-motion";
const motionCss = `
@media (prefers-reduced-motion: no-preference) {
  .${styleId} { transition: transform .18s ease, box-shadow .18s ease; }
  .${styleId}:hover { transform: translateY(-3px);
    box-shadow: 0 10px 30px color-mix(in srgb, var(--color-ink) 12%, transparent); }
}`;

registerBlock({
  type: "services",
  variants: ["cards", "list", "icon-grid"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "Our services";
    const items =
      (block.props.items as ServiceItem[] | undefined) ??
      defaultItems(ctx.business.niche);
    const variant = block.variant;

    if (variant === "list") {
      return section(
        <>
          <p style={eyebrow}>What we do</p>
          <h2 style={h2}>{heading}</h2>
          <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.75rem" }}>
            {items.map((it) => (
              <div
                key={it.title}
                className={styleId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "1.25rem",
                  alignItems: "baseline",
                  padding: "1.1rem 1.25rem",
                  borderLeft: "3px solid var(--color-accent)",
                  borderRadius: "var(--radius)",
                  background: "var(--color-surface)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "var(--color-ink)",
                    fontFamily: "var(--font-display)",
                    fontSize: "1.15rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Title item={it} />
                </h3>
                <p style={{ margin: 0, color: "var(--color-muted)" }}>{it.body}</p>
              </div>
            ))}
          </div>
          <style dangerouslySetInnerHTML={{ __html: motionCss }} />
        </>
      );
    }

    if (variant === "icon-grid") {
      return section(
        <>
          <p style={eyebrow}>What we do</p>
          <h2 style={h2}>{heading}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            {items.map((it, i) => (
              <div
                key={it.title}
                className={styleId}
                style={{
                  ...iconTile,
                }}
              >
                <span
                  style={{
                    display: "inline-grid",
                    placeItems: "center",
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius)",
                    background:
                      "color-mix(in srgb, var(--color-brand) 12%, transparent)",
                    marginBottom: "0.85rem",
                  }}
                >
                  <Glyph i={i} />
                </span>
                <h3
                  style={{
                    margin: "0 0 0.35rem",
                    color: "var(--color-ink)",
                    fontSize: "1.02rem",
                  }}
                >
                  <Title item={it} />
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-muted)",
                    fontSize: "0.92rem",
                  }}
                >
                  {it.body}
                </p>
              </div>
            ))}
          </div>
          <style dangerouslySetInnerHTML={{ __html: motionCss }} />
        </>
      );
    }

    // default: cards
    return section(
      <>
        <p style={eyebrow}>What we do</p>
        <h2 style={h2}>{heading}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginTop: "1.5rem",
          }}
        >
          {items.map((it) => (
            <div key={it.title} className={styleId} style={card}>
              <h3 style={{ margin: "0 0 0.5rem", color: "var(--color-ink)" }}>
                <Title item={it} />
              </h3>
              <p style={{ margin: 0, color: "var(--color-muted)" }}>{it.body}</p>
            </div>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{ __html: motionCss }} />
      </>
    );
  },
});

const iconTile: CSSProperties = {
  padding: "1.35rem",
  borderRadius: "var(--radius)",
  border: "1px solid color-mix(in srgb, var(--color-muted) 20%, transparent)",
  background: "var(--color-surface)",
};
