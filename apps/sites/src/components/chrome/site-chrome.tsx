/**
 * App-level site chrome (server components). SiteShell wraps the renderer's
 * <main>: it derives the nav from tenant data (buildSiteNav), renders the
 * scoped styles, the sticky header (logo + desktop nav + phone + CTA, or the
 * mobile hamburger), the dark sitemap footer, and the mobile sticky call bar.
 *
 * This is intentionally NOT a registry block — the theme gallery and the
 * console live-preview render pages WITHOUT chrome. Everything is token-driven
 * so the chrome matches each tenant's palette, fonts, radius, and button style.
 */
import type { CSSProperties, ReactNode } from "react";
import type { SiteTokens } from "@platform/db";
import type { ResolvedSite } from "../../lib/resolve-site";
import { buildSiteNav, type SiteNav } from "../../lib/site-nav";
import { ChromeStyles, Icon, CHROME_MAX, ctaStyle, telHref } from "./chrome-core";
import { DesktopNav, MobileChrome } from "./nav-widgets";

function SiteHeader({ nav, tokens }: { nav: SiteNav; tokens: SiteTokens }) {
  return (
    <header
      className="pf"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--color-surface)",
        borderBottom: "1px solid color-mix(in srgb, var(--color-ink) 8%, var(--color-surface))",
      }}
    >
      <div style={{ maxWidth: CHROME_MAX, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "14px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, minWidth: 0 }}>
          <a href={nav.home.href} aria-label={nav.footer.meta.businessName} style={{ display: "inline-flex", alignItems: "center", gap: 9, flex: "none" }}>
            <span style={{ display: "inline-flex", width: 32, height: 32, borderRadius: 8, background: "var(--color-ink)", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon name="home" size={17} style={{ color: "var(--color-surface)" }} />
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--color-ink)", whiteSpace: "nowrap" }}>{nav.footer.meta.businessName}</span>
          </a>
          <DesktopNav nav={nav} />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div className="pf-desktop" style={{ alignItems: "center", gap: 14 }}>
            {nav.phone && (
              <a href={`tel:${telHref(nav.phone)}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 15, color: "var(--color-ink)", whiteSpace: "nowrap" }}>
                <Icon name="phone" size={14} style={{ color: "var(--color-brand)" }} />
                {nav.phone}
              </a>
            )}
            <a href={nav.cta.href} style={ctaStyle(tokens.buttonStyle)}>{nav.cta.label}</a>
          </div>
          <MobileChrome nav={nav} buttonStyle={tokens.buttonStyle} />
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ nav }: { nav: SiteNav }) {
  const m = nav.footer.meta;
  const head: CSSProperties = { fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-surface) 50%, var(--color-ink))", marginBottom: 13 };
  const colLink: CSSProperties = { display: "block", fontSize: 13, padding: "4px 0", color: "color-mix(in srgb, var(--color-surface) 78%, var(--color-ink))" };
  const contactRow: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, color: "color-mix(in srgb, var(--color-surface) 72%, var(--color-ink))" };

  return (
    <footer className="pf pf-foot" style={{ background: "var(--color-ink)", color: "var(--color-surface)" }}>
      <div style={{ maxWidth: CHROME_MAX, margin: "0 auto", padding: "40px 24px 0" }}>
        <div className="pf-footgrid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 30, paddingBottom: 30 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
              <span style={{ display: "inline-flex", width: 28, height: 28, borderRadius: 7, background: "var(--color-surface)", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="home" size={15} style={{ color: "var(--color-ink)" }} />
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }}>{m.businessName}</span>
            </div>
            {m.tagline && (
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "color-mix(in srgb, var(--color-surface) 55%, var(--color-ink))", margin: "0 0 14px", maxWidth: 260 }}>{m.tagline}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
              {m.phone && <a href={`tel:${telHref(m.phone)}`} style={contactRow}><Icon name="phone" size={13} style={{ color: "var(--color-brand)" }} />{m.phone}</a>}
              {m.email && <a href={`mailto:${m.email}`} style={contactRow}><Icon name="mail" size={13} style={{ color: "var(--color-brand)" }} />{m.email}</a>}
              {m.hours.length > 0 && (
                <span style={contactRow}>
                  <Icon name="clock" size={13} style={{ color: "var(--color-brand)", flex: "none" }} />
                  {m.hours.map((h) => `${h.label} ${h.value}`).join(" · ")}
                </span>
              )}
            </div>
            {m.socials.length > 0 && (
              <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
                {m.socials.map((s) => (
                  <a key={s.href} href={s.href} aria-label={s.platform} style={{ width: 30, height: 30, borderRadius: 8, background: "color-mix(in srgb, var(--color-surface) 10%, transparent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={s.platform === "instagram" ? "instagram" : "facebook"} size={15} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {nav.footer.columns.map((col) => (
            <div key={col.title}>
              <div style={head}>{col.title}</div>
              <div>
                {col.links.map((l) => (
                  <a key={l.href + l.label} href={l.href} style={colLink}>{l.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid color-mix(in srgb, var(--color-surface) 12%, transparent)", padding: "16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-surface) 50%, var(--color-ink))" }}>
            © {m.year} {m.businessName}{m.licenseNumber ? ` · Lic# ${m.licenseNumber}` : ""}{m.insured ? " · Insured" : ""}
          </span>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            {m.legalLinks.map((l) => (
              <a key={l.href} href={l.href} style={{ color: "color-mix(in srgb, var(--color-surface) 60%, var(--color-ink))" }}>{l.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({ site, children }: { site: ResolvedSite; children: ReactNode }) {
  const nav = buildSiteNav(site);
  return (
    <>
      <ChromeStyles />
      <SiteHeader nav={nav} tokens={site.tokens} />
      <div className="pf-bodypad">{children}</div>
      <SiteFooter nav={nav} />
      <div
        className="pf pf-callbar"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 90,
          background: "var(--color-surface)",
          borderTop: "1px solid color-mix(in srgb, var(--color-ink) 10%, var(--color-surface))",
        }}
      >
        {nav.phone && (
          <a href={`tel:${telHref(nav.phone)}`} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, fontWeight: 700, fontSize: 15, color: "var(--color-ink)", borderRight: "1px solid color-mix(in srgb, var(--color-ink) 8%, var(--color-surface))" }}>
            <Icon name="phone" size={17} style={{ color: "var(--color-brand)" }} />Call
          </a>
        )}
        <a href={nav.cta.href} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 16, fontWeight: 700, fontSize: 15, color: "var(--color-accent)" }}>
          {nav.cta.label}
        </a>
      </div>
    </>
  );
}


/**
 * Breadcrumb bar — rendered by the renderer at the top of <main> on inner
 * pages. Returns null on the home page (a single crumb). Structurally typed
 * crumbs ({ name, href? }) so it needs no import from the routing module.
 */
export function Breadcrumbs({ crumbs }: { crumbs: { name: string; href?: string }[] }) {
  if (crumbs.length <= 1) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="pf"
      style={{
        background: "color-mix(in srgb, var(--color-ink) 2.5%, var(--color-surface))",
        borderBottom: "1px solid color-mix(in srgb, var(--color-ink) 6%, var(--color-surface))",
      }}
    >
      <ol style={{ maxWidth: CHROME_MAX, margin: "0 auto", padding: "10px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, listStyle: "none", fontSize: 13 }}>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {c.href && !last ? (
                <a href={c.href} style={{ color: "color-mix(in srgb, var(--color-ink) 58%, var(--color-surface))" }}>{c.name}</a>
              ) : (
                <span aria-current={last ? "page" : undefined} style={{ color: last ? "var(--color-ink)" : "color-mix(in srgb, var(--color-ink) 58%, var(--color-surface))", fontWeight: last ? 600 : 400 }}>{c.name}</span>
              )}
              {!last && <Icon name="chevron-right" size={13} style={{ color: "color-mix(in srgb, var(--color-ink) 34%, var(--color-surface))", flex: "none" }} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
