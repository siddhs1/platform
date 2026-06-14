# Step 2 Build Map ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Public Site Page System + Navigation (Part A)

> **PRD Phase 1 / Step 2.** Status record lives in `memory.db`; the repo is the source of truth.
> Sources: `docs/PRD.md` Ãƒâ€šÃ‚Â§9 Ãƒâ€šÃ‚Â· `docs/WIREFRAMES.md` Part A (A0ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“A13) Ãƒâ€šÃ‚Â· `Platform Designs.dc.html` (hi-fi) Ãƒâ€šÃ‚Â· `packages/blocks` (renderer).
> Baseline commit: `f263aa6` (notifications spine, Phase 1 Step 1). Designs are READY ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ building resumes here.

## Conventions & guardrails (carry forward)
- **Build/run with BARE `pnpm`**, never corepack (corepack trips pnpm 11's version guard on turbo's children; bare pnpm self-switches to the 9.12.0 pin). PowerShell may flag pnpm's stderr banner as an error ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â judge by turbo's "N successful" summary + exit 0.
- **Customization stays in data** (L1 tokens ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ L2 block variants ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ L3 scoped CSS ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ L4 flag-gated). No tenant `if` branches, no forks.
- **`packages/blocks` is the single renderer** shared by the sites app AND the console live-preview. New blocks/templates flow through `registry.ts` so preview === production.
- Keep the `fonts.ts` `--f-<slug>` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Â `FONT_PAIRS var(--f-*)` contract in sync, and the `@platform/config` `BLOCK_VARIANTS` map ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Â `registry.ts` in sync.
- Don't re-trip the logged `session_fixes` (route folder is `sites` not `_sites`; extensionless relative imports; `decodeURIComponent` the `[host]` param; `next/font` args must be object-literals; create bracketed route dirs via .NET, not PowerShell `New-Item`; delete `.next` before build after moving routes).
- **Push is authorized** — work on `develop`; `main` = PROD (origin/main). Commit to develop and push freely; merge develop -> main for releases.

## Design system (from the canvas)
Trust Blue `#1D4ED8` (brand) Ãƒâ€šÃ‚Â· Action Orange `#EA580C` (accent) Ãƒâ€šÃ‚Â· Ink `#0E1726` Ãƒâ€šÃ‚Â· Hanken Grotesk Ãƒâ€šÃ‚Â· radii 10ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“18px (soft) Ãƒâ€šÃ‚Â· subtle depth Ãƒâ€šÃ‚Â· always-reachable CTA Ãƒâ€šÃ‚Â· WCAG AA. ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ built token-driven, shipped as the **trust-blue** preset.

## Legend
`[v1]` = launch MVP scope Ãƒâ€šÃ‚Â· `[P2]` = deferred to Phase 2 Ãƒâ€šÃ‚Â· ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ = existing block reused Ãƒâ€šÃ‚Â· ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ = new block.

---

## Phase 0 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Design-system foundation (unblocks all of Step 2)
- [x] **F0.1** Add Hanken Grotesk to `apps/sites/src/app/fonts.ts` as `--f-hanken` (object-literal args only ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no spread/vars/computed).
- [x] **F0.2** Add Hanken pairing(s) to `FONT_PAIRS` in `packages/blocks/src/tokens.ts` (display+body ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `var(--f-*)` + system fallback).
- [x] **F0.3** Create `packages/db/src/presets.ts` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â named `SiteTokens` presets; add **trust-blue** matching the canvas (brand/accent/ink/surface/muted, radius soft, fontPair hanken, buttonStyle).
- [x] **F0.4** Carry the 3 existing seed themes into `presets.ts`; refactor `seed.ts` + `_gallery` to source themes from it (kill the duplicated inline themes).
- [x] **F0.5** Extend `shared.tsx` primitives for chrome (container width, nav link, button variants, focus-visible ring) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â token-driven, AA.
- [x] **F0.6** Define the navigation model: primary menu + services mega (niche-derived) + areas dropdown (`serviceAreas`-derived) + footer columns. Derive from niche/services/areas/pages; minimal configurable top menu in `site_configs` only if needed.
- [x] **F0.7** `BusinessProfile` type (tagline/phone/email/address/hours/license/insured/socials) in `db/types.ts` + optional `profile` on `ResolvedSite`; `buildSiteNav()` reads it.
- [x] **F0.8** Persist the profile: `tenants.businessProfile` jsonb column + migration 0004 + resolver select + seed the 3 demos' contact/NAP/hours/license. (A0 chrome renders this data.)
- [x] **F0.V** Verify: bare `pnpm typecheck` + sites `build` green.

## Phase 1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â A0 site chrome / shell (lock the system first)
- [x] **A0.1** Shell that wraps the block-rendered `<main>` with header + footer (segment layout under `sites/[host]`); token-driven, CSS-isolated like the rest of sites.
- [x] **A0.2** Desktop header: logo/business name, primary nav, phone, "Get a Quote" CTA; sticky, subtle depth.
- [x] **A0.3** Services mega-menu (niche services + "View all services") ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â interactive; `'use client'` widget + server-neutral registration (before-after split pattern); keyboard + hover, AA, `prefers-reduced-motion`.
- [x] **A0.4** Areas dropdown (`serviceAreas` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `/areas/<city>`) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â interactive, same pattern.
- [x] **A0.5** Footer sitemap: Brand/NAP/hours Ãƒâ€šÃ‚Â· Services Ãƒâ€šÃ‚Â· Service Areas Ãƒâ€šÃ‚Â· Company Ãƒâ€šÃ‚Â· Legal (license #, Privacy/Terms/Accessibility). Server-rendered.
- [x] **A0.6** Mobile header + slide-in drawer (hamburger ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ nav + CTA), `'use client'`.
- [x] **A0.7** Sticky mobile call bar (Call Ãƒâ€šÃ‚Â· Get a Quote), `'use client'`, reveal on scroll, `prefers-reduced-motion`.
- [x] **A0.8** Breadcrumbs component + `BreadcrumbList` JSON-LD (interior pages).
- [x] **A0.9** Wire chrome into the renderer/layout for all authored + generated pages; keep `_gallery` + `/preview` chrome-isolated.
- [x] **A0.V** Verify: 3 demo hosts render with chrome; dropdowns + drawer + call bar work; AA; build green.

## Phase 2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â New blocks the designs need
Reused ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“: hero, services, testimonials, reviews-feed, service-area, before-after, team, faq, gallery, cta-band, contact-form, footer.
New ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ (each: register in `registry.ts`, add to `BLOCK_VARIANTS`, self-populate with niche defaults, AA, reduced-motion, show in `_gallery`):
- [x] **BLK.trust-bar** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ credentials/stats/logos strip under hero (Home).
- [x] **BLK.why-us** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ value-props / icon-feature grid (Home).
- [x] **BLK.story** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ rich-text / prose section (About).
- [x] **BLK.stats** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ metric cards ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â years, jobs, rating (About).
- [x] **BLK.credentials** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ license/insurance/cert badges (About, money page).
- [x] **BLK.guarantee** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ guarantee/warranty callout (About, money page).
- [x] **BLK.lead-hero** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ hero + inline lead form (money page A4).
- [x] **BLK.process** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ "what happens next" steps (money page A4).
- [x] **BLK.included** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ what's-included checklist (money page A4).
- [x] **BLK.blog-index** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ and **BLK.blog-post** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ scaffold (A8).
- [x] **BLK.contact** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ split: form + map + NAP/hours (A10).
- [x] **BLK.financing** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ financing options/info (A12). Calculator stays L4/[P2].
- [x] **BLK.legal** ÃƒÂ¯Ã‚Â¼Ã¢â‚¬Â¹ long-form prose template (A13).

## Phase 3 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Page templates (block recipes, seeded into `site_configs.pages`)
- [ ] **PG.home** (A1) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â hero Ãƒâ€šÃ‚Â· trust-bar Ãƒâ€šÃ‚Â· services Ãƒâ€šÃ‚Â· why-us Ãƒâ€šÃ‚Â· before-after Ãƒâ€šÃ‚Â· reviews Ãƒâ€šÃ‚Â· service-area Ãƒâ€šÃ‚Â· faq Ãƒâ€šÃ‚Â· cta-band.
- [ ] **PG.about** (A2) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â hero Ãƒâ€šÃ‚Â· story Ãƒâ€šÃ‚Â· stats Ãƒâ€šÃ‚Â· credentials Ãƒâ€šÃ‚Â· team Ãƒâ€šÃ‚Â· guarantee Ãƒâ€šÃ‚Â· cta-band.
- [ ] **PG.services-index** (A3) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â services index + links to money pages.
- [ ] **PG.service-detail** (A4) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â enhance generated money-page template: lead-hero Ãƒâ€šÃ‚Â· included Ãƒâ€šÃ‚Â· process Ãƒâ€šÃ‚Â· service-area(nearby) Ãƒâ€šÃ‚Â· credentials/guarantee Ãƒâ€šÃ‚Â· cta-band; keep Service JSON-LD.
- [ ] **PG.areas** (A5) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â areas hub + city (enhance existing synthesis; internal linking).
- [ ] **PG.gallery** (A6) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â gallery page.
- [ ] **PG.reviews** (A7) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â reviews-feed + summary page.
- [ ] **PG.blog** (A8) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â blog index + post scaffold (seeded posts, no CMS yet).
- [ ] **PG.faq** (A9) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â faq page (FAQPage JSON-LD already emitted).
- [ ] **PG.contact** (A10) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â contact block (form + map + NAP).
- [ ] **PG.booking** (A11) `[P2]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â deferred.
- [ ] **PG.financing** (A12) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â financing page.
- [ ] **PG.legal-404** (A13) `[v1]` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â privacy/terms/accessibility long-form + styled 404.
- [ ] **PG.seed** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â seed the 3 demo tenants with the full [v1] multi-page site so demos showcase the whole system.

## Phase 4 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Navigation wiring & SEO
- [ ] **NAV.menu** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â primary menu from pages/config; active state.
- [ ] **NAV.services-mega** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â from niche services ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `/<service>` / `/<service>/<city>`.
- [ ] **NAV.areas** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â from `serviceAreas` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `/areas/<city>`.
- [ ] **NAV.footer** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â sitemap columns from the same sources.
- [ ] **NAV.breadcrumbs** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â interior pages + `BreadcrumbList` JSON-LD.
- [ ] **SEO.metadata** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â per-template title/description/keywords + canonical.
- [ ] **SEO.jsonld** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â LocalBusiness (all) Ãƒâ€šÃ‚Â· Service (money) Ãƒâ€šÃ‚Â· FAQPage (faq) Ãƒâ€šÃ‚Â· BreadcrumbList (interior) Ãƒâ€šÃ‚Â· BlogPosting (blog).
- [ ] **SEO.sitemap** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â generate `sitemap.xml` + `robots` from authored + generated pages.

## Phase 5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Theme presets surfacing & gallery gating
- [ ] **THM.gallery** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â `_gallery` renders every block ÃƒÆ’- variant ÃƒÆ’- preset, sourced from `presets.ts`.
- [ ] **THM.gate** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â gate `_gallery` behind operator auth/allowlist before any deploy (currently un-gated TODO).
- [ ] **THM.applied** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â demo tenants use presets; roofing demo on trust-blue to match the canvas.

## Phase 6 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Acceptance & housekeeping
- [ ] **ACC.build** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â bare `pnpm typecheck` + `lint` + `build` green (NOT corepack).
- [ ] **ACC.routes** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â every `[v1]` route 200s with chrome + correct JSON-LD; bogus ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 404 (via `next start` + Host-header curls).
- [ ] **ACC.lighthouse** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â perf ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 95 mobile still passes on demo hosts (chrome adds weight ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â verify via the CI lighthouse job).
- [ ] **ACC.a11y** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â keyboard nav, focus-visible, AA contrast, reduced-motion; mobile drawer/call bar.
- [ ] **HK.docs** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â commit `docs/` (PRD, WIREFRAMES, this map) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â currently untracked.
- [ ] **HK.memory** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â update `memory.db` `build_status`/`next_steps` to reflect Step 2 progress.
- [ ] **HK.commit** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â commit in logical chunks (chrome / blocks / templates / nav+seo / presets+gallery). Push only on explicit OK.
