/**
 * Global 404 (app/not-found.tsx).
 *
 * Rendered for any unresolved path, including unknown paths inside a
 * tenant site (the catch-all route calls notFound()). It lives at the
 * ROOT layout, so there is NO resolved-tenant context here (no tokens,
 * no chrome) - by design we keep it simple, neutral, and self-styled.
 * Links are relative, so "home"/"contact" stay on the requesting host.
 */
import type { CSSProperties } from "react";

const wrap: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background: "#0e1726",
  color: "#e7ecf3",
  fontFamily:
    'var(--f-inter), "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

const card: CSSProperties = {
  width: "100%",
  maxWidth: "32rem",
  textAlign: "center",
};

const eyebrow: CSSProperties = {
  fontSize: "0.8rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#7c8aa0",
  margin: 0,
};

const code: CSSProperties = {
  fontFamily: 'var(--f-space-grotesk), "Space Grotesk", system-ui, sans-serif',
  fontSize: "clamp(4rem, 18vw, 8rem)",
  lineHeight: 1,
  fontWeight: 700,
  margin: "0.25rem 0 0.5rem",
  background: "linear-gradient(180deg, #ffffff, #9fb2cc)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const heading: CSSProperties = {
  fontFamily: 'var(--f-space-grotesk), "Space Grotesk", system-ui, sans-serif',
  fontSize: "clamp(1.25rem, 4vw, 1.6rem)",
  fontWeight: 600,
  margin: "0 0 0.75rem",
};

const text: CSSProperties = {
  fontSize: "1rem",
  lineHeight: 1.6,
  color: "#aab6c7",
  margin: "0 auto 2rem",
  maxWidth: "26rem",
};

const actions: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  justifyContent: "center",
  flexWrap: "wrap",
};

const primaryBtn: CSSProperties = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  borderRadius: "0.5rem",
  background: "#3b82f6",
  color: "#ffffff",
  fontWeight: 600,
  textDecoration: "none",
};

const secondaryBtn: CSSProperties = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  borderRadius: "0.5rem",
  background: "transparent",
  color: "#e7ecf3",
  fontWeight: 600,
  textDecoration: "none",
  border: "1px solid #2c3a52",
};

export default function NotFound() {
  return (
    <main style={wrap}>
      <div style={card}>
        <p style={eyebrow}>Error 404</p>
        <div style={code}>404</div>
        <h1 style={heading}>This page could not be found</h1>
        <p style={text}>
          The page you are looking for may have moved, or the link may be out
          of date. Let us get you back on track.
        </p>
        <div style={actions}>
          <a href="/" style={primaryBtn}>
            Back to home
          </a>
          <a href="/contact" style={secondaryBtn}>
            Contact us
          </a>
        </div>
      </div>
    </main>
  );
}
