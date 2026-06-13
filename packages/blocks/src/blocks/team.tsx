/**
 * Team block. Puts faces to the business — trust signal for local trades
 * and clinics alike.
 *   grid      — responsive cards with photo/avatar, name, role (default)
 *   rows      — horizontal media rows with a short bio
 *   spotlight — one featured member large, the rest as a small strip
 *
 * props.members: { name, role, photo?, bio? }[]. When photo is absent we
 * render an initials avatar tinted from brand color, so the block never
 * shows broken images on a fresh site.
 */
import type { CSSProperties } from "react";
import { registerBlock } from "../registry";
import type { SiteBlock } from "@platform/db";
import type { RenderContext } from "../registry";
import { section, h2, eyebrow } from "./shared";

interface Member {
  name: string;
  role: string;
  photo?: string;
  bio?: string;
}

const DEFAULT_MEMBERS: Member[] = [
  { name: "Sam Carter", role: "Owner / Lead Tech", bio: "20 years on the tools. Answers the phone himself." },
  { name: "Dana Liu", role: "Operations", bio: "Schedules every job and keeps crews on time." },
  { name: "Reggie Park", role: "Senior Technician", bio: "The one you want on the tricky calls." },
  { name: "Mia Torres", role: "Customer Care", bio: "Your first call and your follow-up." },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ m, size }: { m: Member; size: number }) {
  if (m.photo) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "var(--radius)",
          backgroundImage: `url(${JSON.stringify(m.photo)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          flexShrink: 0,
        }}
        role="img"
        aria-label={m.name}
      />
    );
  }
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 85%, #000 0%), var(--color-accent))",
        color: "var(--color-surface)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.32,
      }}
    >
      {initials(m.name)}
    </div>
  );
}

function NameRole({ m, center }: { m: Member; center?: boolean }) {
  return (
    <div style={{ textAlign: center ? "center" : "left" }}>
      <strong style={{ display: "block", color: "var(--color-ink)", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
        {m.name}
      </strong>
      <span style={{ color: "var(--color-brand)", fontSize: "0.9rem", fontWeight: 600 }}>{m.role}</span>
    </div>
  );
}

const cardBase: CSSProperties = {
  padding: "1.25rem",
  borderRadius: "var(--radius)",
  border: "1px solid color-mix(in srgb, var(--color-muted) 20%, transparent)",
  background: "var(--color-surface)",
};

registerBlock({
  type: "team",
  variants: ["grid", "rows", "spotlight"],
  render: (block: SiteBlock, _ctx: RenderContext) => {
    const heading = (block.props.heading as string) ?? "Meet the team";
    const members = (block.props.members as Member[] | undefined) ?? DEFAULT_MEMBERS;

    if (block.variant === "rows") {
      return section(
        <>
          <p style={eyebrow}>Our people</p>
          <h2 style={h2}>{heading}</h2>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
            {members.map((m) => (
              <div
                key={m.name}
                style={{ ...cardBase, display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.25rem", alignItems: "center" }}
              >
                <Avatar m={m} size={72} />
                <div>
                  <NameRole m={m} />
                  {m.bio ? (
                    <p style={{ margin: "0.5rem 0 0", color: "var(--color-muted)" }}>{m.bio}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (block.variant === "spotlight") {
      const [lead, ...rest] = members;
      return section(
        <>
          <p style={eyebrow}>Our people</p>
          <h2 style={h2}>{heading}</h2>
          <div
            style={{
              ...cardBase,
              marginTop: "1.5rem",
              display: "grid",
              gridTemplateColumns: "minmax(0, 200px) 1fr",
              gap: "1.75rem",
              alignItems: "center",
            }}
          >
            <Avatar m={lead!} size={200} />
            <div>
              <NameRole m={lead!} />
              {lead!.bio ? (
                <p style={{ margin: "0.75rem 0 0", color: "var(--color-ink)", fontSize: "1.05rem", lineHeight: 1.5 }}>
                  {lead!.bio}
                </p>
              ) : null}
            </div>
          </div>
          {rest.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              {rest.map((m) => (
                <div key={m.name} style={{ ...cardBase, display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <Avatar m={m} size={48} />
                  <NameRole m={m} />
                </div>
              ))}
            </div>
          ) : null}
        </>
      );
    }

    // default: grid
    return section(
      <>
        <p style={eyebrow}>Our people</p>
        <h2 style={h2}>{heading}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            marginTop: "1.5rem",
          }}
        >
          {members.map((m) => (
            <div key={m.name} style={{ ...cardBase, textAlign: "center" }}>
              <div style={{ display: "grid", placeItems: "center", marginBottom: "0.85rem" }}>
                <Avatar m={m} size={120} />
              </div>
              <NameRole m={m} center />
            </div>
          ))}
        </div>
      </>
    );
  },
});
