/**
 * Chrome core: token-aware helpers, an inline-SVG icon set (Lucide-style,
 * stroke=currentColor so color is controlled by CSS), and the single scoped
 * <style> block the chrome needs for the things inline styles can't express
 * (:hover, :focus-visible, responsive show/hide, footer-grid collapse).
 *
 * This module is import-safe from both server and client components - it
 * holds no server-only APIs. Colours resolve from the L1 token CSS vars
 * (--color-ink/brand/accent/surface, --radius, --font-display) that the
 * renderer sets on the wrapping element, so the chrome restyles per tenant.
 */
import type { CSSProperties } from "react";

/** Max content width for the chrome (header + footer inner). */
export const CHROME_MAX = 1200;

/** tel: href - keep digits and a leading +, drop formatting. */
export const telHref = (p: string) => p.replace(/[^\d+]/g, "");

/** Primary CTA style, honouring the tenant's buttonStyle token (accent). */
export function ctaStyle(buttonStyle: string): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1,
    padding: "11px 18px",
    borderRadius: "var(--radius)",
    textDecoration: "none",
    whiteSpace: "nowrap",
    border: "2px solid transparent",
  };
  if (buttonStyle === "outline") {
    return { ...base, background: "transparent", color: "var(--color-accent)", borderColor: "var(--color-accent)" };
  }
  if (buttonStyle === "soft") {
    return { ...base, background: "color-mix(in srgb, var(--color-accent) 16%, var(--color-surface))", color: "var(--color-accent)" };
  }
  return { ...base, background: "var(--color-accent)", color: "var(--color-surface)" };
}

export type IconName =
  | "home" | "phone" | "mail" | "clock"
  | "chevron-down" | "chevron-up" | "chevron-right"
  | "arrow-right" | "menu" | "x"
  | "facebook" | "instagram"
  | "wrench" | "hammer" | "alert" | "calendar-check";

/** Map a (generated) service name to a representative icon. */
export function serviceIcon(name: string): IconName {
  const n = name.toLowerCase();
  if (n.includes("repair")) return "wrench";
  if (n.includes("install")) return "hammer";
  if (n.includes("emergency")) return "alert";
  if (n.includes("maintenance") || n.includes("plan")) return "calendar-check";
  return "wrench";
}

const PATHS: Record<IconName, string> = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-up": '<path d="m18 15-6-6-6 6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  hammer: '<path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m21.5 11.5-1.96-1.96a3 3 0 0 1-.88-2.12V6.5l-2.2-2.2a4 4 0 0 0-2.83-1.17H9.5l1 1a5 5 0 0 1 1.5 3.56v1.43l1.5 1.5h1.43"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "calendar-check": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/><path d="M8 2v4"/><path d="M16 2v4"/>',
};

export function Icon({
  name,
  size = 16,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}

const CHROME_CSS = `
.pf a { color: inherit; text-decoration: none; }
.pf button { font: inherit; color: inherit; background: none; border: none; padding: 0; cursor: pointer; }
.pf a:focus-visible, .pf button:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; border-radius: 4px; }
.pf-navlink { color: color-mix(in srgb, var(--color-ink) 64%, var(--color-surface)); font-weight: 500; }
.pf-navlink:hover { color: var(--color-ink); }
.pf-navlink[data-active="true"] { color: var(--color-ink); font-weight: 700; }
.pf-svc:hover, .pf-areaitem:hover, .pf-viewall:hover, .pf-drawer-link:hover { color: var(--color-brand); }
.pf-foot a:hover { color: var(--color-surface); }
.pf-desktop { display: flex; }
.pf-mobile { display: none; }
.pf-callbar { display: none; }
@media (max-width: 880px) {
  .pf-desktop { display: none !important; }
  .pf-mobile { display: flex !important; }
  .pf-callbar { display: flex !important; }
  .pf-footgrid { grid-template-columns: 1fr 1fr !important; }
  .pf-bodypad { padding-bottom: 64px !important; }
}
@media (max-width: 560px) {
  .pf-footgrid { grid-template-columns: 1fr !important; }
}
`;

/** The single scoped chrome stylesheet. Rendered once by SiteShell. */
export function ChromeStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CHROME_CSS }} />;
}
