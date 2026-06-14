"use client";

/**
 * Interactive chrome: the desktop nav (with the Services mega-menu and Areas
 * dropdown) and the mobile hamburger + drawer. Kept in one client module; the
 * server header/footer embed these. Open/close is React state; hover opens on
 * desktop, click toggles, Escape and outside-click close. All colours come
 * from token CSS vars so it themes per tenant.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SiteNav } from "../../lib/site-nav";
import { Icon, ctaStyle, serviceIcon } from "./chrome-core";

const card: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid color-mix(in srgb, var(--color-ink) 12%, var(--color-surface))",
  borderRadius: 14,
  padding: "18px 22px",
  boxShadow: "0 18px 44px -22px rgba(0,0,0,.40)",
};
const cap: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "color-mix(in srgb, var(--color-ink) 48%, var(--color-surface))",
  marginBottom: 12,
};
const mutedChevron = "color-mix(in srgb, var(--color-ink) 45%, var(--color-surface))";

export function DesktopNav({ nav }: { nav: SiteNav }) {
  const [open, setOpen] = useState<null | "services" | "areas">(null);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panelWrap: CSSProperties = { position: "absolute", top: "calc(100% + 12px)", left: 0, zIndex: 60 };
  const trigger: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 14 };

  return (
    <nav ref={ref} className="pf-desktop" style={{ alignItems: "center", gap: 20 }} aria-label="Primary">
      <a className="pf-navlink" data-active="true" href={nav.home.href}>{nav.home.label}</a>

      <div style={{ position: "relative" }} onMouseEnter={() => setOpen("services")} onMouseLeave={() => setOpen(null)}>
        <button
          aria-haspopup="true"
          aria-expanded={open === "services"}
          onClick={() => setOpen(open === "services" ? null : "services")}
          style={{ ...trigger, fontWeight: 600, color: open === "services" ? "var(--color-brand)" : "var(--color-ink)" }}
        >
          {nav.services.label}
          <Icon name={open === "services" ? "chevron-up" : "chevron-down"} size={14} style={{ color: open === "services" ? "var(--color-brand)" : mutedChevron }} />
        </button>
        {open === "services" && (
          <div style={panelWrap}>
            <div style={{ ...card, minWidth: 430 }}>
              <div style={cap}>{nav.services.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 32px" }}>
                {nav.services.items.map((s) => {
                  const ic = serviceIcon(s.label);
                  return (
                    <a key={s.href} href={s.href} className="pf-svc" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                      <Icon name={ic} size={16} style={{ color: ic === "alert" ? "var(--color-accent)" : "var(--color-brand)", flex: "none" }} />
                      {s.label}
                    </a>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid color-mix(in srgb, var(--color-ink) 10%, var(--color-surface))" }}>
                <a href={nav.services.viewAll.href} className="pf-viewall" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "var(--color-brand)" }}>
                  {nav.services.viewAll.label}
                  <Icon name="arrow-right" size={14} style={{ color: "var(--color-brand)" }} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {nav.areas && (
        <div style={{ position: "relative" }} onMouseEnter={() => setOpen("areas")} onMouseLeave={() => setOpen(null)}>
          <button
            aria-haspopup="true"
            aria-expanded={open === "areas"}
            onClick={() => setOpen(open === "areas" ? null : "areas")}
            style={{ ...trigger, fontWeight: 500, color: open === "areas" ? "var(--color-brand)" : "color-mix(in srgb, var(--color-ink) 64%, var(--color-surface))" }}
          >
            {nav.areas.label}
            <Icon name={open === "areas" ? "chevron-up" : "chevron-down"} size={14} style={{ color: open === "areas" ? "var(--color-brand)" : mutedChevron }} />
          </button>
          {open === "areas" && (
            <div style={panelWrap}>
              <div style={{ ...card, minWidth: 190 }}>
                <div style={cap}>{nav.areas.label}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {nav.areas.items.map((a) => (
                    <a key={a.href} href={a.href} className="pf-areaitem" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>{a.label}</a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {nav.primary.map((l) => (
        <a key={l.href} href={l.href} className="pf-navlink" style={{ fontSize: 14 }}>{l.label}</a>
      ))}
    </nav>
  );
}

export function MobileChrome({ nav, buttonStyle }: { nav: SiteNav; buttonStyle: string }) {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<null | "services" | "areas">(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const row: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 14px",
    fontWeight: 600,
    fontSize: 16,
    color: "var(--color-ink)",
    width: "100%",
    textAlign: "left",
  };
  const subLink: CSSProperties = { display: "block", padding: "10px 8px", fontSize: 15, color: "color-mix(in srgb, var(--color-ink) 78%, var(--color-surface))" };
  const iconBox: CSSProperties = { display: "inline-flex", width: 40, height: 40, borderRadius: 10, background: "var(--color-ink)", alignItems: "center", justifyContent: "center", color: "var(--color-surface)", flex: "none" };

  return (
    <div className="pf-mobile" style={{ alignItems: "center" }}>
      <button aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} style={iconBox}>
        <Icon name="menu" size={20} />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" style={{ position: "fixed", inset: 0, zIndex: 100, background: "var(--color-surface)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid color-mix(in srgb, var(--color-ink) 8%, var(--color-surface))" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--color-ink)" }}>{nav.footer.meta.businessName}</span>
            <button aria-label="Close menu" onClick={() => setOpen(false)} style={{ ...iconBox, width: 38, height: 38 }}>
              <Icon name="x" size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
            <a href={nav.home.href} onClick={() => setOpen(false)} style={{ ...row, background: "color-mix(in srgb, var(--color-ink) 4%, var(--color-surface))", borderRadius: 10, fontWeight: 700 }}>{nav.home.label}</a>

            <button style={row} aria-expanded={sub === "services"} onClick={() => setSub(sub === "services" ? null : "services")}>
              {nav.services.label}
              <Icon name={sub === "services" ? "chevron-up" : "chevron-right"} size={18} style={{ color: mutedChevron }} />
            </button>
            {sub === "services" && (
              <div style={{ padding: "0 14px 8px" }}>
                {nav.services.items.map((s) => (
                  <a key={s.href} href={s.href} onClick={() => setOpen(false)} className="pf-drawer-link" style={subLink}>{s.label}</a>
                ))}
                <a href={nav.services.viewAll.href} onClick={() => setOpen(false)} style={{ ...subLink, fontWeight: 700, color: "var(--color-brand)" }}>{nav.services.viewAll.label}</a>
              </div>
            )}

            {nav.areas && (
              <>
                <button style={row} aria-expanded={sub === "areas"} onClick={() => setSub(sub === "areas" ? null : "areas")}>
                  {nav.areas.label}
                  <Icon name={sub === "areas" ? "chevron-up" : "chevron-right"} size={18} style={{ color: mutedChevron }} />
                </button>
                {sub === "areas" && (
                  <div style={{ padding: "0 14px 8px" }}>
                    {nav.areas.items.map((a) => (
                      <a key={a.href} href={a.href} onClick={() => setOpen(false)} className="pf-drawer-link" style={subLink}>{a.label}</a>
                    ))}
                  </div>
                )}
              </>
            )}

            {nav.primary.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={row}>{l.label}</a>
            ))}

            <div style={{ padding: "14px 8px" }}>
              <a href={nav.cta.href} onClick={() => setOpen(false)} style={{ ...ctaStyle(buttonStyle), justifyContent: "center", width: "100%", padding: 14, fontSize: 15 }}>
                {nav.cta.label}
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
