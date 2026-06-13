"use client";
/**
 * Before / after — interactive widgets (client component).
 * The flagship interactive block's stateful pieces live here behind
 * "use client"; registration + the static side-by-side variant live in
 * before-after.tsx (server-neutral), so the registry stays out of the
 * client bundle.
 *   slider       — draggable handle wipes between before & after (default)
 *   side-by-side — two labelled panels, no interaction
 *   toggle       — a button flips between the two states
 *
 * This file is a client component ("use client") because the slider and
 * toggle need state and pointer events. It is still rendered from the
 * server-component renderer via the registry — Next allows a client
 * component as a child of a server component. The block is self-contained
 * and reads only from CSS variables, so it themes per tenant like the rest.
 *
 * Images: props.before / props.after are image URLs. When absent we render
 * labelled gradient placeholders so the block previews without assets
 * (matches how hero renders a gradient when it has no image).
 */
import { useCallback, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { SiteBlock } from "@platform/db";
import { section, h2, eyebrow } from "./shared";

export interface BAProps {
  heading?: string;
  before?: string; // image URL
  after?: string; // image URL
  beforeLabel?: string;
  afterLabel?: string;
}

const panelBase: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

export function panelBg(url: string | undefined, which: "before" | "after"): CSSProperties {
  if (url) return { ...panelBase, backgroundImage: `url(${JSON.stringify(url)})` };
  // Placeholder gradients: muted/desaturated for "before", brand for "after".
  return {
    ...panelBase,
    background:
      which === "before"
        ? "linear-gradient(135deg, color-mix(in srgb, var(--color-muted) 55%, #888), color-mix(in srgb, var(--color-ink) 30%, #666))"
        : "linear-gradient(135deg, var(--color-accent), var(--color-brand))",
  };
}

export const tag: CSSProperties = {
  position: "absolute",
  top: "0.75rem",
  padding: "0.3rem 0.7rem",
  borderRadius: "var(--radius)",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  background: "color-mix(in srgb, var(--color-ink) 78%, transparent)",
  color: "var(--color-surface)",
  pointerEvents: "none",
};

export const frame: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 10",
  borderRadius: "var(--radius)",
  overflow: "hidden",
  marginTop: "1.5rem",
  userSelect: "none",
};

export function Slider({ p }: { p: BAProps }) {
  const [pos, setPos] = useState(50); // percent revealed of "after"
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onKey = useCallback((e: { key: string; preventDefault: () => void }) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPos((v) => Math.max(0, v - 4));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPos((v) => Math.min(100, v + 4));
    }
  }, []);

  return (
    <div
      ref={ref}
      style={{ ...frame, cursor: dragging ? "grabbing" : "ew-resize", touchAction: "none" }}
      onPointerDown={(e: any) => {
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e: any) => {
        if (dragging) setFromClientX(e.clientX);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {/* after fills the frame; before is clipped to the left of the handle */}
      <div style={panelBg(p.after, "after")} aria-hidden />
      <div
        style={{
          ...panelBg(p.before, "before"),
          clipPath: `inset(0 ${100 - pos}% 0 0)`,
        }}
        aria-hidden
      />
      <span style={{ ...tag, left: "0.75rem" }}>{p.beforeLabel ?? "Before"}</span>
      <span style={{ ...tag, right: "0.75rem" }}>{p.afterLabel ?? "After"}</span>

      {/* handle */}
      <div
        role="slider"
        aria-label="Reveal after image"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        onKeyDown={onKey}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${pos}%`,
          width: 2,
          background: "var(--color-surface)",
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-ink) 30%, transparent)",
          transform: "translateX(-1px)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 38,
            height: 38,
            borderRadius: "9999px",
            background: "var(--color-surface)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 2px 10px color-mix(in srgb, var(--color-ink) 30%, transparent)",
            color: "var(--color-brand)",
            fontSize: "0.9rem",
          }}
        >
          ⟷
        </span>
      </div>
    </div>
  );
}

export function Toggle({ p }: { p: BAProps }) {
  const [showAfter, setShowAfter] = useState(true);
  return (
    <>
      <div style={frame}>
        <div style={panelBg(showAfter ? p.after : p.before, showAfter ? "after" : "before")} aria-hidden />
        <span style={{ ...tag, left: "0.75rem" }}>
          {showAfter ? p.afterLabel ?? "After" : p.beforeLabel ?? "Before"}
        </span>
      </div>
      <div style={{ display: "inline-flex", gap: "0.5rem", marginTop: "1rem" }} role="group" aria-label="Toggle before and after">
        <button
          type="button"
          onClick={() => setShowAfter(false)}
          aria-pressed={!showAfter}
          style={toggleBtn(!showAfter)}
        >
          {p.beforeLabel ?? "Before"}
        </button>
        <button
          type="button"
          onClick={() => setShowAfter(true)}
          aria-pressed={showAfter}
          style={toggleBtn(showAfter)}
        >
          {p.afterLabel ?? "After"}
        </button>
      </div>
    </>
  );
}

function toggleBtn(active: boolean): CSSProperties {
  return {
    padding: "0.6rem 1.2rem",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-brand)",
    background: active ? "var(--color-brand)" : "transparent",
    color: active ? "var(--color-surface)" : "var(--color-brand)",
    fontWeight: 600,
    cursor: "pointer",
  };
}
