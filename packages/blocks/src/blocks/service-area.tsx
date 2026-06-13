/**
 * Service-area block. Communicates where the business works — important
 * for local SEO and for the per-city page strategy in the build plan.
 *   map-pins  — stylized region panel with pinned city labels (default)
 *   city-list — chip grid of served cities
 *   radius    — "X miles around <City>" statement with concentric rings
 *
 * props.areas is a string[] of city names; falls back to the tenant's
 * home city plus a few generic nearby-area labels so it renders populated.
 */
import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow, lead } from "./shared";

interface SAProps {
  heading?: string;
  areas?: string[];
  radiusMiles?: number;
}

function defaultAreas(city: string): string[] {
  return [city, "Downtown", "North End", "Westside", "Lakeshore", "Eastgate"];
}

const chip: CSSProperties = {
  padding: "0.55rem 1rem",
  borderRadius: "var(--radius)",
  background: "color-mix(in srgb, var(--color-brand) 10%, var(--color-surface))",
  border: "1px solid color-mix(in srgb, var(--color-brand) 25%, transparent)",
  color: "var(--color-ink)",
  fontSize: "0.95rem",
  fontWeight: 500,
};

function Pin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-accent)" aria-hidden>
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

registerBlock({
  type: "service-area",
  variants: ["map-pins", "city-list", "radius"],
  render: (block: SiteBlock, ctx: RenderContext) => {
    const p = block.props as SAProps;
    const heading = p.heading ?? `Proudly serving ${ctx.business.city}`;
    const areas = p.areas ?? defaultAreas(ctx.business.city);

    if (block.variant === "city-list") {
      return section(
        <>
          <p style={eyebrow}>Service area</p>
          <h2 style={h2}>{heading}</h2>
          <p style={lead}>
            On call across {ctx.business.city} and the surrounding {ctx.business.state} communities.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1.5rem" }}>
            {areas.map((a) => (
              <span key={a} style={chip}>
                {a}
              </span>
            ))}
          </div>
        </>
      );
    }

    if (block.variant === "radius") {
      const miles = p.radiusMiles ?? 25;
      return section(
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: "2.5rem",
            alignItems: "center",
          }}
        >
          <div>
            <p style={eyebrow}>Service area</p>
            <h2 style={h2}>{heading}</h2>
            <p style={lead}>
              We cover roughly <strong style={{ color: "var(--color-ink)" }}>{miles} miles</strong> around{" "}
              {ctx.business.city}. Not sure if you're in range? Call and ask — we'll tell you straight.
            </p>
          </div>
          {/* concentric rings */}
          <div style={{ display: "grid", placeItems: "center" }}>
            <div style={{ position: "relative", width: 240, height: 240 }}>
              {[240, 168, 96].map((d, i) => (
                <span
                  key={d}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: d,
                    height: d,
                    transform: "translate(-50%, -50%)",
                    borderRadius: "9999px",
                    border: "1px solid color-mix(in srgb, var(--color-brand) 35%, transparent)",
                    background:
                      i === 2
                        ? "color-mix(in srgb, var(--color-brand) 14%, transparent)"
                        : "transparent",
                  }}
                />
              ))}
              <span
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Pin />
              </span>
            </div>
          </div>
        </div>
      );
    }

    // default: map-pins — abstract region panel with scattered pins
    const positions = [
      { top: "22%", left: "30%" },
      { top: "40%", left: "62%" },
      { top: "58%", left: "38%" },
      { top: "30%", left: "78%" },
      { top: "68%", left: "70%" },
      { top: "50%", left: "18%" },
    ];
    return section(
      <>
        <p style={eyebrow}>Service area</p>
        <h2 style={h2}>{heading}</h2>
        <div
          style={{
            position: "relative",
            marginTop: "1.5rem",
            height: 320,
            borderRadius: "var(--radius)",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-brand) 18%, var(--color-surface)), var(--color-surface))",
            border: "1px solid color-mix(in srgb, var(--color-muted) 20%, transparent)",
          }}
        >
          {/* faint grid lines to read as a map */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(color-mix(in srgb, var(--color-muted) 12%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-muted) 12%, transparent) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden
          />
          {areas.slice(0, positions.length).map((a, i) => (
            <div
              key={a}
              style={{
                position: "absolute",
                top: positions[i]!.top,
                left: positions[i]!.left,
                transform: "translate(-50%, -100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Pin />
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  background: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                {a}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  },
});
