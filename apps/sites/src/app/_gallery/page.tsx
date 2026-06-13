/**
 * Internal theme gallery — every block × every variant × every seed theme,
 * on one screen. Triple duty:
 *   • sales demo  — show a prospect the range without a live tenant
 *   • QA surface  — eyeball every variant after a change
 *   • VA reference — see what each variant/token combo looks like
 *
 * This lives at /_gallery. The underscore prefix makes it a PRIVATE route
 * segment in the App Router, so it is NOT reachable as a tenant hostname
 * path and never collides with the [host] catch-all. It's an internal tool;
 * gate it behind auth/allowlist before any public deploy.
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
import type { SiteTokens, SiteBlock } from "@platform/db";

export const metadata = { title: "Theme gallery (internal)" };

// ── The three seed themes, inlined so the gallery is self-contained and
//    doesn't need a DB round-trip. Keep in sync with packages/db/seed.ts.
const THEMES: { label: string; business: { name: string; niche: string; city: string; state: string }; tokens: SiteTokens }[] = [
  {
    label: "Roofing — sharp / navy+amber / Archivo",
    business: { name: "Summit Roofing Co.", niche: "Roofers", city: "Tampa", state: "FL" },
    tokens: {
      colors: { brand: "#1F3A5F", accent: "#E8A33D", ink: "#16202B", surface: "#FFFFFF", muted: "#5C6B7A" },
      fontPair: "archivo-inter", radius: "sharp", buttonStyle: "solid", density: "comfortable",
    },
  },
  {
    label: "Dental — pill / teal / Fraunces",
    business: { name: "Bright Smile Dental", niche: "Dentists", city: "Raleigh", state: "NC" },
    tokens: {
      colors: { brand: "#0E8C8C", accent: "#7FD1C4", ink: "#1A2E2E", surface: "#F7FBFB", muted: "#6B8585" },
      fontPair: "fraunces-nunito", radius: "pill", buttonStyle: "soft", density: "spacious",
    },
  },
  {
    label: "Bistro — soft / wine+gold / Playfair",
    business: { name: "Olive & Ember", niche: "Restaurants", city: "Austin", state: "TX" },
    tokens: {
      colors: { brand: "#7A2E2E", accent: "#D9A441", ink: "#2B1A12", surface: "#FBF6EE", muted: "#8A6F5C" },
      fontPair: "playfair-source", radius: "soft", buttonStyle: "outline", density: "comfortable",
    },
  },
];

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
        Gate this route behind auth before deploying. Themes mirror packages/db/seed.ts.
      </footer>
    </main>
  );
}
