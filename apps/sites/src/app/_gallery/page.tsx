/**
 * Internal theme gallery — every block × every variant × every preset theme,
 * on one screen. Triple duty:
 *   • sales demo  — show a prospect the range without a live tenant
 *   • QA surface  — eyeball every variant after a change
 *   • VA reference — see what each variant/token combo looks like
 *
 * This lives at /_gallery. The underscore prefix makes it a PRIVATE route
 * segment in the App Router, so it is NOT reachable as a tenant hostname
 * path and never collides with the [host] catch-all. It's an internal tool;
 * gate it behind auth/allowlist before any public deploy (see THM.gate).
 *
 * It renders blocks straight through the shared registry — the same path
 * the live renderer uses — so if it looks right here, it looks right in
 * production.
 */
import {
  renderBlock,
  tokensToCssVars,
  allBlockDefinitions,
} from "@platform/blocks";
import { THEME_PRESETS } from "@platform/db";
import type { SiteBlock } from "@platform/db";

export const metadata = { title: "Theme gallery (internal)" };

// Sample businesses paired with each preset so niche-derived and flag-gated
// blocks render with realistic context. Niches are generative (any label
// works — see servicesForNiche). The token values come from the shared
// preset library (packages/db/presets.ts) — the single source of truth — so
// they are NOT re-inlined here.
const SAMPLE_BUSINESS: Record<
  string,
  { name: string; niche: string; city: string; state: string }
> = {
  "trust-blue": { name: "Summit Roofing Co.", niche: "Roofers", city: "Tampa", state: "FL" },
  "slate-trades": { name: "Apex Plumbing", niche: "Plumbers", city: "Columbus", state: "OH" },
  "teal-care": { name: "Bright Smile Dental", niche: "Dentists", city: "Raleigh", state: "NC" },
  "wine-hospitality": { name: "Olive & Ember", niche: "Restaurants", city: "Austin", state: "TX" },
};

const FALLBACK_BUSINESS = { name: "Acme Local", niche: "Contractors", city: "Denver", state: "CO" };

const THEMES = THEME_PRESETS.map((preset) => {
  const business = SAMPLE_BUSINESS[preset.id] ?? FALLBACK_BUSINESS;
  return {
    label: `${preset.label} · ${business.niche} · ${preset.tokens.radius}/${preset.tokens.fontPair}`,
    business,
    tokens: preset.tokens,
  };
});

// A neutral feature-flag set that turns on any flag a block might require,
// so flag-gated blocks still appear in the gallery.
const allFlagsOn = new Proxy({} as Record<string, boolean>, { get: () => true });

function sampleBlock(type: string, variant: string): SiteBlock {
  // Minimal props; blocks fall back to niche-derived defaults for the rest.
  return { id: `${type}-${variant}`, type: type as SiteBlock["type"], variant, props: {} };
}

export default function GalleryPage() {
  const defs = allBlockDefinitions();

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", background: "#0b0b0c", color: "#e8e8ea", minHeight: "100vh" }}>
      <header style={{ padding: "2rem 1.5rem 1rem", maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem" }}>Theme gallery</h1>
        <p style={{ color: "#9a9aa2", marginTop: "0.5rem" }}>
          {defs.length} block types · {defs.reduce((s, d) => s + d.variants.length, 0)} variants · {THEMES.length} themes.
          Internal QA / sales / VA reference. Each card renders through the live registry.
        </p>
      </header>

      {defs.map((def) => (
        <section key={def.type} style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.15rem", borderBottom: "1px solid #26262b", paddingBottom: "0.5rem" }}>
            {def.type}
            <span style={{ color: "#7a7a82", fontWeight: 400, fontSize: "0.85rem", marginLeft: "0.75rem" }}>
              {def.variants.join(" · ")}
            </span>
          </h2>

          {def.variants.map((variant) => (
            <div key={variant} style={{ marginTop: "1.25rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#9a9aa2", margin: "0 0 0.5rem", fontFamily: "ui-monospace, monospace" }}>
                {def.type} / {variant}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
                {THEMES.map((theme) => {
                  const cssVars = tokensToCssVars(theme.tokens);
                  return (
                    <div
                      key={theme.label}
                      style={{ border: "1px solid #26262b", borderRadius: 10, overflow: "hidden", background: "#fff" }}
                    >
                      <div style={{ fontSize: "0.7rem", color: "#9a9aa2", padding: "0.4rem 0.6rem", background: "#16161a", fontFamily: "ui-monospace, monospace" }}>
                        {theme.label}
                      </div>
                      {/* The themed render surface — identical to production */}
                      <div style={cssVars}>
                        {renderBlock(sampleBlock(def.type, variant), {
                          tokens: theme.tokens,
                          featureFlags: allFlagsOn,
                          business: theme.business,
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}

      <footer style={{ padding: "2rem 1.5rem 4rem", maxWidth: 1200, margin: "0 auto", color: "#7a7a82", fontSize: "0.85rem" }}>
        Gate this route behind auth before deploying. Themes come from the shared preset library (packages/db/presets.ts).
      </footer>
    </main>
  );
}
