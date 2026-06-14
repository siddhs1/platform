# Step 2 Build Map -- Public Site Page System + Navigation (Part A)

> **PRD Phase 1 / Step 2.** Status record lives in `memory.db`; the repo is the source of truth.
> Sources: `docs/PRD.md` --9 -- `docs/WIREFRAMES.md` Part A (A0--A13) -- `Platform Designs.dc.html` (hi-fi) -- `packages/blocks` (renderer).
> Baseline commit: `f263aa6` (notifications spine, Phase 1 Step 1). Designs are READY -- -- building resumes here.

## Conventions & guardrails (carry forward)
- **Build/run with BARE `pnpm`**, never corepack (corepack trips pnpm 11's version guard on turbo's children; bare pnpm self-switches to the 9.12.0 pin). PowerShell may flag pnpm's stderr banner as an error -- judge by turbo's "N successful" summary + exit 0.
- **Customization stays in data** (L1 tokens -- -- L2 block variants -- -- L3 scoped CSS -- -- L4 flag-gated). No tenant `if` branches, no forks.
- **`packages/blocks` is the single renderer** shared by the sites app AND the console live-preview. New blocks/templates flow through `registry.ts` so preview === production.
- Keep the `fonts.ts` `--f-<slug>` -- -- `FONT_PAIRS var(--f-*)` contract in sync, and the `@platform/config` `BLOCK_VARIANTS` map -- -- `registry.ts` in sync.
- Don't re-trip the logged `session_fixes` (route folder is `sites` not `_sites`; extensionless relative imports; `decodeURIComponent` the `[host]` param; `next/font` args must be object-literals; create bracketed route dirs via .NET, not PowerShell `New-Item`; delete `.next` before build after moving routes).
- **Push is authorized** -- work on `develop`; `main` = PROD (origin/main). Commit to develop and push freely; merge develop -> main for releases.

## Design system (from the canvas)
Trust Blue `#1D4ED8` (brand) -- Action Orange `#EA580C` (accent) -- Ink `#0E1726` -- Hanken Grotesk -- radii 10--18px (soft) -- subtle depth -- always-reachable CTA -- WCAG AA. -- -- built token-driven, shipped as the **trust-blue** preset.

## Legend
`[v1]` = launch MVP scope -- `[P2]` = deferred to Phase 2 -- -- = existing block reused -- -- = new block.

---

## Phase 0 -- Design-system foundation (unblocks all of Step 2)
- [x] **F0.1** Add Hanken Grotesk to `apps/sites/src/app/fonts.ts` as `--f-hanken` (object-literal args only -- no spread/vars/computed).
- [x] **F0.2** Add Hanken pairing(s) to `FONT_PAIRS` in `packages/blocks/src/tokens.ts` (display+body -- -- `var(--f-*)` + system fallback).
- [x] **F0.3** Create `packages/db/src/presets.ts` -- named `SiteTokens` presets; add **trust-blue** matching the canvas (brand/accent/ink/surface/muted, radius soft, fontPair hanken, buttonStyle).
- [x] **F0.4** Carry the 3 existing seed themes into `presets.ts`; refactor `seed.ts` + `_gallery` to source themes from it (kill the duplicated inline themes).
- [x] **F0.5** Extend `shared.tsx` primitives for chrome (container width, nav link, button variants, focus-visible ring) -- token-driven, AA.
- [x] **F0.6** Define the navigation model: primary menu + services mega (niche-derived) + areas dropdown (`serviceAreas`-derived) + footer columns. Derive from niche/services/areas/pages; minimal configurable top menu in `site_configs` only if needed.
- [x] **F0.7** `BusinessProfile` type (tagline/phone/email/address/hours/license/insured/socials) in `db/types.ts` + optional `profile` on `ResolvedSite`; `buildSiteNav()` reads it.
- [x] **F0.8** Persist the profile: `tenants.businessProfile` jsonb column + migration 0004 + resolver select + seed the 3 demos' contact/NAP/hours/license. (A0 chrome renders this data.)
- [x] **F0.V** Verify: bare `pnpm typecheck` + sites `build` green.

## Phase 1 -- A0 site chrome / shell (lock the system first)
- [x] **A0.1** Shell that wraps the block-rendered `<main>` with header + footer (segment layout under `sites/[host]`); token-driven, CSS-isolated like the rest of sites.
- [x] **A0.2** Desktop header: logo/business name, primary nav, phone, "Get a Quote" CTA; sticky, subtle depth.
- [x] **A0.3** Services mega-menu (niche services + "View all services") -- interactive; `'use client'` widget + server-neutral registration (before-after split pattern); keyboard + hover, AA, `prefers-reduced-motion`.
- [x] **A0.4** Areas dropdown (`serviceAreas` -- -- `/areas/<city>`) -- interactive, same pattern.
- [x] **A0.5** Footer sitemap: Brand/NAP/hours -- Services -- Service Areas -- Company -- Legal (license #, Privacy/Terms/Accessibility). Server-rendered.
- [x] **A0.6** Mobile header + slide-in drawer (hamburger -- -- nav + CTA), `'use client'`.
- [x] **A0.7** Sticky mobile call bar (Call -- Get a Quote), `'use client'`, reveal on scroll, `prefers-reduced-motion`.
- [x] **A0.8** Breadcrumbs component + `BreadcrumbList` JSON-LD (interior pages).
- [x] **A0.9** Wire chrome into the renderer/layout for all authored + generated pages; keep `_gallery` + `/preview` chrome-isolated.
- [x] **A0.V** Verify: 3 demo hosts render with chrome; dropdowns + drawer + call bar work; AA; build green.

## Phase 2 -- New blocks the designs need
Reused --: hero, services, testimonials, reviews-feed, service-area, before-after, team, faq, gallery, cta-band, contact-form, footer.
New -- (each: register in `registry.ts`, add to `BLOCK_VARIANTS`, self-populate with niche defaults, AA, reduced-motion, show in `_gallery`):
- [x] **BLK.trust-bar** -- credentials/stats/logos strip under hero (Home).
- [x] **BLK.why-us** -- value-props / icon-feature grid (Home).
- [x] **BLK.story** -- rich-text / prose section (About).
- [x] **BLK.stats** -- metric cards -- years, jobs, rating (About).
- [x] **BLK.credentials** -- license/insurance/cert badges (About, money page).
- [x] **BLK.guarantee** -- guarantee/warranty callout (About, money page).
- [x] **BLK.lead-hero** -- hero + inline lead form (money page A4).
- [x] **BLK.process** -- "what happens next" steps (money page A4).
- [x] **BLK.included** -- what's-included checklist (money page A4).
- [x] **BLK.blog-index** -- and **BLK.blog-post** -- scaffold (A8).
- [x] **BLK.contact** -- split: form + map + NAP/hours (A10).
- [x] **BLK.financing** -- financing options/info (A12). Calculator stays L4/[P2].
- [x] **BLK.legal** -- long-form prose template (A13).

## Phase 3 -- Page templates (block recipes, seeded into `site_configs.pages`)
- [x] **PG.home** (A1) `[v1]` -- hero -- trust-bar -- services -- why-us -- before-after -- reviews -- service-area -- faq -- cta-band.
- [x] **PG.about** (A2) `[v1]` -- hero -- story -- stats -- credentials -- team -- guarantee -- cta-band.
- [x] **PG.services-index** (A3) `[v1]` -- services index + links to money pages.
- [x] **PG.service-detail** (A4) `[v1]` -- enhance generated money-page template: lead-hero -- included -- process -- service-area(nearby) -- credentials/guarantee -- cta-band; keep Service JSON-LD.
- [x] **PG.areas** (A5) `[v1]` -- areas hub + city (enhance existing synthesis; internal linking).
- [x] **PG.gallery** (A6) `[v1]` -- gallery page.
- [x] **PG.reviews** (A7) `[v1]` -- reviews-feed + summary page.
- [x] **PG.blog** (A8) `[v1]` -- blog index + post scaffold (seeded posts, no CMS yet).
- [x] **PG.faq** (A9) `[v1]` -- faq page (FAQPage JSON-LD already emitted).
- [x] **PG.contact** (A10) `[v1]` -- contact block (form + map + NAP).
- [ ] **PG.booking** (A11) `[P2]` -- deferred.
- [x] **PG.financing** (A12) `[v1]` -- financing page.
- [x] **PG.legal-404** (A13) `[v1]` -- privacy/terms/accessibility long-form + styled 404.
- [x] **PG.seed** -- seed the 3 demo tenants with the full [v1] multi-page site so demos showcase the whole system. (DECISION 2026-06-14: generation chosen over seeding -- the generated page templates already render the full multi-page site for all 3 demos at request time, so no per-tenant authored seeding is needed; a future console "eject to authored" feature could revisit this.)

## Phase 4 -- Navigation wiring & SEO
- [x] **NAV.menu** -- primary menu from pages/config; active state.
- [x] **NAV.services-mega** -- from niche services -- -- `/<service>` / `/<service>/<city>`.
- [x] **NAV.areas** -- from `serviceAreas` -- -- `/areas/<city>`.
- [x] **NAV.footer** -- sitemap columns from the same sources.
- [x] **NAV.breadcrumbs** -- interior pages + `BreadcrumbList` JSON-LD.
- [x] **SEO.metadata** -- per-template title/description/keywords + canonical.
- [x] **SEO.jsonld** -- LocalBusiness (all) -- Service (money) -- FAQPage (faq) -- BreadcrumbList (interior) -- BlogPosting (blog).
- [x] **SEO.sitemap** -- generate `sitemap.xml` + `robots` from authored + generated pages.

## Phase 5 -- Theme presets surfacing & gallery gating
- [ ] **THM.gallery** -- `_gallery` renders every block --- variant --- preset, sourced from `presets.ts`.
- [ ] **THM.gate** -- gate `_gallery` behind operator auth/allowlist before any deploy (currently un-gated TODO).
- [ ] **THM.applied** -- demo tenants use presets; roofing demo on trust-blue to match the canvas.

## Phase 6 -- Acceptance & housekeeping
- [ ] **ACC.build** -- bare `pnpm typecheck` + `lint` + `build` green (NOT corepack).
- [ ] **ACC.routes** -- every `[v1]` route 200s with chrome + correct JSON-LD; bogus -- -- 404 (via `next start` + Host-header curls).
- [ ] **ACC.lighthouse** -- perf -- 95 mobile still passes on demo hosts (chrome adds weight -- verify via the CI lighthouse job).
- [ ] **ACC.a11y** -- keyboard nav, focus-visible, AA contrast, reduced-motion; mobile drawer/call bar.
- [ ] **HK.docs** -- commit `docs/` (PRD, WIREFRAMES, this map) -- currently untracked.
- [ ] **HK.memory** -- update `memory.db` `build_status`/`next_steps` to reflect Step 2 progress.
- [ ] **HK.commit** -- commit in logical chunks (chrome / blocks / templates / nav+seo / presets+gallery). Push only on explicit OK.
