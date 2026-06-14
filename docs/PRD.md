# Product Requirements Document
## Multi-Tenant Local-Business Web Platform (working name: "Platform")

| Field | Value |
|---|---|
| Version | 1.0 (draft) |
| Date | 2026-06-13 |
| Status | Draft for review |
| Owner | Founder / agency owner |
| Repo | `C:\Users\LENOVO\Downloads\files\platform` (Turborepo + pnpm) |
| Source of truth | Repo code; `memory.db` holds design+state record |
| Supersedes | The informal Week 1-4 build plan recorded in `memory.db` |

> This PRD reconciles what has actually been built (Weeks 1-3) with the original business vision, names the gap that currently blocks onboarding, and specifies the full product across all three surfaces - with the tenant-facing console and the retention tooling spelled out in detail. It then re-plans the road to a launch-ready MVP.

---

## Table of contents

1. Executive summary
2. Vision and strategy
3. Problem statement, goals, non-goals
4. Personas
5. Product principles
6. System architecture overview
7. Current-state audit (what exists today)
8. Gap analysis (what blocks launch)
9. Surface A - Public tenant websites
10. Surface B - Operator console
11. Surface C - Tenant (client) console
12. Value-add tools and the retention model
13. Data model additions
14. Roles and permissions (RBAC)
15. Integrations
16. Non-functional requirements
17. Pricing and packaging
18. Roadmap (re-planned phases)
19. Launch-readiness checklist
20. Success metrics
21. Risks and open questions
22. Appendix

---

## 1. Executive summary

The Platform is a single multi-tenant SaaS that an agency uses to build, host, and operate SEO-optimized websites for local businesses (roofers, dentists, restaurants, and similar), and to deliver the recurring services that justify a monthly retainer. A client is a database row, not a server. Customization lives in data, not code.

Three product surfaces:

- **Public websites** (one Next.js app serving every tenant by hostname) - the marketing asset that ranks and converts visitors into leads.
- **Operator console** (agency + VA admin) - manage all tenants, leads, content, publishing, and billing. **Built.**
- **Tenant console** (the business owner's self-serve dashboard) - see your leads, request changes, manage your own customer invoicing, store receipts, grow reviews, and read the monthly report that proves the retainer is worth it. **Not built - this PRD's primary new scope.**

The strategic thesis is retention: ~97% infra margin means the business lives or dies on **logo churn**. The tenant console is the surface where the client *sees* the value (leads arriving, reviews growing, ROI math, monthly reports). Every tool in Section 12 is chosen because it makes value visible or makes the client's own operations depend on the Platform - both reduce churn.

This document specifies that tenant console, upgrades the public sites from "blocks that render" to a real multi-page site system (About, services menu, service detail, gallery, blog, FAQ, contact, booking, legal pages, with real navigation), and lays out a phased plan to reach a state where onboarding the first paying client is a content+config job done in under a day.

## 2. Vision and strategy

**Vision.** Become the operating system for a portfolio of local-business websites where one operator (plus contractors) can run 35-50 clients profitably, each client locked in by visible results and by having their leads, payments, reviews, and records flowing through the Platform.

**Business model (carried forward, unchanged).**
- Pricing tiers: **Basic ~$249/mo**, **Growth ~$599-799/mo** (push everyone here), **Scale ~$1,200-2,000/mo**. Build fee $1,500-5,000 or $0-down + higher monthly.
- Target ~35-40 clients at ~$650 blended ARPU => **$22-26k MRR** on ~$150-400/mo infra (~97% gross margin).
- **One client per niche per city** (exclusivity close; enforced in DB via a unique index on niche+city+state).
- Work buckets: zero-touch automated (hosting, SSL, backups, monitoring, reports), templated contractor/VA work (content, citations, review responses), high-judgment owner work (sales, strategy, ads).
- GTM: density-based state rollout (FL/TX/NC/TN/OH/AZ first), audit-first outreach, ~50 contacts -> 5-10 conversations -> 1-3 clients.

**Why a custom platform (not GoHighLevel).** The decision was made to skip an interim platform and build the moat directly, so there is no migration later and the unit economics aren't taxed by a per-seat reseller fee. The cost is that Weeks 1-4 produce the foundation rather than client-facing revenue; the mitigation is to sell in parallel and onboard the moment the MVP is ready.

**The retention thesis (the spine of this PRD).** A local business owner does not evaluate "a website" monthly; they evaluate "am I getting calls and is my money working." The Platform must therefore (a) generate and *surface* leads, (b) quantify ROI in plain language, (c) deliver a monthly report that recaps results and work done, and (d) embed itself into the client's daily operations (invoicing their customers, storing receipts, managing reviews) so that leaving means losing infrastructure, not just a webpage.

## 3. Problem statement, goals, non-goals

**Problem.** The foundation (rendering engine, operator console, billing scaffold) is solid, but a paying client cannot yet (1) reach a polished multi-page site with real navigation, (2) log into anything of their own, (3) see their leads, (4) request changes, (5) handle their money, or (6) receive proof of value. There is also no onboarding flow and no custom-domain provisioning. The product is "foundation complete," not "launch ready."

**Primary goals (this PRD).**
- G1. Specify and build the **tenant console** with the tools clients were promised.
- G2. Upgrade public sites to a **real multi-page system** (page templates + navigation + design polish).
- G3. Define **value-add tools** that make ROI visible and embed the Platform in client operations, mapped to tiers and to a retention rationale.
- G4. Re-plan delivery into phases with a clear definition of **launch-ready**.

**Secondary goals.** Wire the deferred integrations (email/SMS, Cloudflare custom domains, background jobs), formalize RBAC (owner/staff/client), and harden for production (backups, monitoring, data export, legal pages).

**Non-goals (explicitly out of scope, for now).**
- Becoming a general website builder for the public (this is operator/VA-driven, with limited client self-serve).
- Bespoke per-client engineering (everything is data/config or a quoted add-on block).
- Full accounting software. Expense/receipt capture is "records for your bookkeeper," explicitly **not tax advice or filing**.
- A public app marketplace, multi-currency, or non-US tax handling (revisit post-scale).

## 4. Personas

**P1 - Agency owner (operator).** Runs the business solo early on. Needs to manage all tenants, publish changes, watch billing, and keep churn low with minimal time per client. Lives in the operator console.

**P2 - VA / fulfillment contractor (operator, limited).** Does templated work: content, citations, review responses, fielding change requests, light edits. Needs scoped access (no billing, no destructive actions). Lives in the operator console with a reduced permission set.

**P3 - Business owner (client / tenant admin).** The roofer/dentist/restaurateur paying the retainer. Not technical. Cares about calls, reviews, money, and whether this is worth it. Checks their phone, not a dashboard, by default - so notifications matter as much as the console. Lives in the tenant console.

**P4 - Client's staff (tenant member).** Front-desk person or office manager who handles incoming leads, replies, invoices, and bookings on the owner's behalf. Needs the operational parts of the tenant console without billing/cancel powers.

**P5 - The end customer (lead).** The homeowner/patient/diner who visits the public site. Never logs in. Needs a fast, trustworthy, mobile-first site with an obvious way to call or submit a request, and (for some niches) to book an appointment or pay an invoice.


---

## 5. Product principles

1. **One codebase, one database, never per-client servers.** Fix once, deploy everywhere. A tenant is a row.
2. **Customization lives in data, not code.** Four layers: L1 design tokens, L2 page/block composition, L3 scoped custom CSS (capped), L4 custom blocks behind feature flags. No tenant `if` statements, no forks.
3. **Explicit tenant isolation.** Every query filters by `tenant_id`; RLS is defense-in-depth. Authorization is enforced in server actions before mutations.
4. **Graceful degradation.** Every external dependency (DB, Clerk, Stripe, Twilio, email) is lazy and optional at build/boot; a missing key yields a clear "not configured" state, never a crash. (Already true for DB, Clerk, Stripe.)
5. **Retention by visible value.** No feature ships without an answer to "how does this make the client's value obvious or embed us in their operations?"
6. **Productized, not bespoke.** New site = content+config in under a day. Weird requests are quoted as add-on blocks or declined.
7. **Performance and SEO are non-negotiable.** Mobile Lighthouse >= 95 is a CI gate; structured data on every page type.
8. **VA-operable with a paper trail.** Changes flow through a request queue; publishing is versioned and reversible.

## 6. System architecture overview

**Monorepo (Turborepo + pnpm).** `apps/sites` (public, :3000), `apps/console` (operator + tenant consoles, :3001), `packages/db` (Drizzle schema + migrations + RLS), `packages/blocks` (block registry + renderer + niche catalog), `packages/config` (Zod validation).

**Stack.** Next.js 15 (App Router), Drizzle ORM + Neon Postgres 17 (aws-us-east-1), Clerk (auth + organizations), Stripe + Stripe Connect (billing + client invoicing), Cloudflare for SaaS (custom hostnames + SSL), Twilio (call tracking + SMS), Resend or equivalent (transactional email), Inngest (background jobs).

**Surfaces and routing.**
- Public sites: hostname middleware -> resolver -> renderer maps published config blocks. ISR with tag-based invalidation on publish.
- Operator console: `/` dashboard, `/tenants/[tenantId]/...` management, `/api/*` webhooks, `/preview/[tenantId]`.
- **Tenant console (new):** a separate authenticated area, scoped to a single tenant, at its own route group and/or subdomain (e.g. `app.<agency>.com` with org-based tenant resolution, or a `/portal/...` group within the console app). Decision in Section 11.

**Environments.** Local (.env, degraded integrations) and production (Vercel + Neon + secrets). Neon branching for staging rather than separate projects.

## 7. Current-state audit (what exists today)

Grounded in the repo and `memory.db`. Commit state: `main` is 4 commits ahead of `origin/main` (b6d1567, 235ea85, 5b76139, d93e2ac), **not pushed**.

**Public sites (Weeks 1-2) - working.**
- Hostname routing middleware (strips `www`, rewrites host into a path); tenant resolver (joins domains -> tenants -> published config, decodes percent-encoded host, ISR-cached with `host:<hostname>` tag).
- Catch-all renderer page: resolves tenant, finds page by path, injects tokens as CSS variables, emits `LocalBusiness` JSON-LD, maps blocks through the registry; unknown block types render nothing (never 500s).
- **12 block types, 31 variants total** (hero, services, testimonials, service-area, before/after, team, FAQ, cta-band, contact-form, reviews-feed, gallery, footer), subtle motion behind `prefers-reduced-motion`.
- Design tokens -> CSS vars; `next/font` self-hosting 15 families exposed as `--f-<slug>`, 9 curated pairings.
- **Generated per-service/per-city pages**: `serviceAreas[]` on tenants drives `/areas/<city>` hubs and `/<service>/<city>` money pages, synthesized at request time, city-scoped, internally linked, emitting `Service` JSON-LD; FAQ blocks emit `FAQPage` JSON-LD.
- Public lead intake API (`/api/lead`): resolves tenant by host, inserts a `source=form` lead.
- Zod validation at the save/publish boundary (`tokensSchema`, `siteConfigSchema`, per-variant validation).
- Internal theme gallery exists but lives in a **private route segment (`_gallery`) and is not reachable** (known limitation).

**Database - migrated and applied.**
- Tables: `tenants`, `domains`, `site_configs` (draft+published), `config_versions` (rollback history), `leads`, `change_requests`, `subscriptions` (new in Commit 4). Enums for all statuses. `UNIQUE(niche, city, state)` enforces exclusivity.
- RLS: `tenant_isolation` on all tenant tables + `tenant_self` on tenants, keyed off `app.tenant_id` (defense-in-depth; `subscriptions` now covered, enabled+forced).
- Migration + seed runners (`tsx --env-file`); idempotent seed of 3 demo tenants.

**Operator console (Week 3) - working.**
- Dashboard: tenant list, stat cards, per-tenant new-lead counts.
- Per-tenant: overview, **leads inbox + pipeline** (filter by stage, per-stage counts, status change via form-based server action with `getTenant`/`canAccessTenant` authz and id-AND-tenant-scoped updates).
- **Site editor**: edit draft tokens + custom CSS (validated), **live preview** (draft rendered through the production block renderer in an iframe), **publish** (upsert published row + append `config_versions` snapshot + version bump), **rollback** (re-publish a validated older snapshot), **change-request list** (read-only).
- Twilio inbound-voice webhook **stub** (`/api/twilio/voice`): records `source=call` leads, resolves tenant by `?tenant=<slug>`, returns TwiML, never breaks the call flow.
- **Stripe billing scaffold** (Commit 4): billing page (subscription status, start-checkout, manage-portal), webhook (`/api/stripe/webhook`, signature-verified, upserts subscription state), `subscriptions` table; degrades without keys.
- Auth: Clerk wired but **degrades without keys**; role model simplified to a single `owner`; `CONSOLE_DEV_NO_AUTH=1` local bypass. No Clerk Organizations yet.

**DevOps.** CI: `pnpm install --frozen-lockfile` + typecheck + lint + build on Node 22; Lighthouse job (mobile >= 95) on the sites hosts only.

## 8. Gap analysis (what blocks launch)

**Blocking for onboarding the first paying client (must-have, Phase 1):**
- **No tenant console at all.** Clients cannot log in or see anything of their own. The `client` role and Clerk Organizations are not built; `canAccessTenant` exists but there is no client-facing UI.
- **No custom-domain provisioning.** Cloudflare for SaaS hostname API is not wired; adding a real domain is a manual runbook, not a button. A real client needs their own domain live with SSL.
- **No onboarding flow.** No intake -> create tenant + seed draft config. Tenants only exist via the seed script today.
- **Thin site page system.** Block variants exist, but there are no first-class **page templates** (About, services index/menu, service detail, gallery-as-page, FAQ-as-page, contact-as-page, legal) and no real **navigation** (header menu with dropdowns/mega-menu, footer sitemap with NAP/hours/areas). A client site today is essentially a long homepage + generated city pages.
- **No notifications.** Email (Resend) and Twilio SMS are not wired, so a new lead does not reach the client. For a trades client, an instant lead alert is the single most important feature.
- **Billing is a scaffold only.** No real prices wired, no invoice/receipt UI for the client, no dunning.
- **No legal pages / no data export / no formal backups-monitoring-support.**

**Blocking for retention (high-value, Phase 2):**
- No **monthly report** (the retainer justifier).
- No **reviews engine** (request/monitor/respond/display).
- No **call tracking with recordings** (Twilio stub only logs a lead).
- No **client invoicing** (Stripe Connect) or **expense/receipt capture**.
- No **appointment booking**.
- No **rank tracking** to prove SEO value.
- No **self-serve site appearance** for safe fields (hours, photos).

**Quality/maintenance gaps:** theme gallery unreachable; change-request queue is list-only (no create/manage); `sites_reader` DB role for production-correct public reads not created; no multi-user client teams.


---

## 9. Surface A - Public tenant websites

Goal: move from "a long homepage plus generated city pages" to a complete, navigable, conversion-optimized multi-page site that looks bespoke but is 100% data/config.

### 9.1 Page-type system

Today the renderer resolves a page by path from `site_configs.pages` (authored) or synthesizes city/service pages. We formalize a set of **page templates**, each a typed composition of blocks with sensible per-niche defaults. Authored pages always win; templates fill the rest.

| Page | Path | Purpose | Default blocks |
|---|---|---|---|
| Home | `/` | Convert + rank for "[service] [city]" | hero, trust-bar, services, before/after, reviews-feed, service-area, FAQ, cta-band, contact-form, footer |
| About | `/about` | Trust, story, team, credentials | page-hero, story, team, credentials/badges, stats, cta-band |
| Services index (menu) | `/services` | Hub linking every service | page-hero, services (grid/menu), cta-band |
| Service detail | `/services/<service>` | Rank + convert per service | service-hero, what's-included, process steps, gallery, reviews (service-filtered), FAQ (service), service-area, cta |
| Service + city (money page) | `/<service>/<city>` | Local intent (exists) | as today, plus breadcrumbs + related links |
| Areas hub / area page | `/areas`, `/areas/<city>` | Local coverage (exists) | as today, plus map + city list |
| Gallery / portfolio | `/gallery` | Proof of work | page-hero, gallery (filterable), before/after, cta |
| Reviews | `/reviews` | Social proof + fresh content | page-hero, reviews-feed (full), ratings summary, cta |
| Blog index + post | `/blog`, `/blog/<slug>` | SEO content engine (VA-fed) | list/cards; article template with author, date, related, cta |
| FAQ | `/faq` | Long-tail + objection handling | page-hero, FAQ (full), cta |
| Contact | `/contact` | Primary conversion | page-hero, contact-form (split), map, hours, NAP, click-to-call |
| Booking | `/book` | Appointment niches | booking widget (Section 12), confirmation |
| Financing / offers | `/financing`, `/offers` | Trades upsell / promos | offer hero, terms, cta |
| Legal | `/privacy`, `/terms`, `/accessibility` | Compliance | legal-doc template (generated from a per-tenant template) |
| 404 | n/a | Recovery | branded not-found with nav + search/CTA |

Implementation notes:
- Add a `pageType` discriminator to the page schema so templates are validated and the navigation builder knows what exists.
- Blog posts get their **own table** (`posts`) rather than living only in jsonb, for listing, pagination, sitemap, and RSS (see Section 13).
- Each template emits the right structured data: `LocalBusiness` (site-wide), `Service` (service pages), `FAQPage` (FAQ), `Review`/`AggregateRating` (reviews), `Article` (blog), `BreadcrumbList` (all deep pages), `Organization` (about).

### 9.2 Navigation and information architecture

- **Header**: logo, primary nav (Home, Services [dropdown/mega-menu of services], Areas [dropdown of cities], About, Reviews, Blog, Contact), a prominent **phone CTA** (click-to-call on mobile) and a "Get a quote" button. Sticky on scroll; condensed on mobile to a drawer + a persistent bottom **call/quote bar**.
- **Services mega-menu**: lists services (from the niche catalog) and links to `/services/<service>`; optionally grouped.
- **Areas menu**: lists `serviceAreas` cities linking to `/areas/<city>`.
- **Footer**: NAP (name/address/phone), hours, service-area links, services links, social, license numbers, legal links, and a compact contact form or CTA. Footer doubles as an internal-linking sitemap for SEO.
- **Breadcrumbs** on all deep pages.
- Navigation is **generated from the page set + niche catalog + serviceAreas**, with per-tenant overrides in config (reorder, hide, rename, add custom links).

### 9.3 Design system upgrades

The token system (colors, fontPair, radius, buttonStyle, density) stays, but we raise the ceiling on visual quality and variety so sites do not read as templated:

- **Theme presets** (not just tokens): 6-10 named, opinionated looks (e.g. "Bold Trades," "Clean Clinical," "Warm Hospitality," "Modern Minimal") that bundle tokens + default block variants + section rhythm + imagery treatment. A new site picks a preset, then tunes tokens.
- **Section variety**: alternating backgrounds, tinted surfaces, full-bleed imagery, stat strips, logo/credential bars, split layouts - so a scroll has rhythm rather than stacked cards.
- **Imagery and media**: hero image/video support, gallery with lightbox, before/after slider (exists), and an asset pipeline (Section 13 `media`) with responsive sizes and `next/image`.
- **Trust and conversion elements**: review stars/aggregate near the hero, license/insurance badges, guarantees, financing callouts, "as-seen-in" bars, sticky CTA, exit-aware quote prompts (tasteful).
- **Accessibility**: WCAG 2.2 AA contrast, focus states, semantic landmarks, reduced-motion respected (already), forms labeled and keyboard-complete.
- **Performance budget**: keep mobile Lighthouse >= 95; only the active font pair downloads; images responsive; minimal JS (interactive blocks already isolated to client boundaries).

### 9.4 Per-niche content presets

So a fresh site looks authored before a VA touches it: the niche catalog (`servicesForNiche`) already seeds services; extend presets to seed About copy, FAQ sets, gallery placeholders, review samples (clearly replaceable), and hero/value propositions per niche (trades vs clinical vs hospitality). Real content overrides defaults via block props.

### 9.5 Conversion instrumentation

- All CTAs (call, form, book) tagged with source so the tenant console can attribute leads to pages/sources.
- Click-to-call uses the Twilio tracking number (Section 12) so calls are logged.
- Form submissions create leads (exists) and now also fire notifications (Phase 1) and lead-source attribution.
- Optional lightweight, privacy-respecting analytics (server-side page counts by tenant) feeding the monthly report.

### 9.6 Acceptance criteria (Surface A)

A seeded demo tenant renders all core page types with working header/footer navigation, a services mega-menu, breadcrumbs, correct structured data per page, mobile Lighthouse >= 95, and an accessible, distinct theme - with the theme gallery reachable behind operator auth for QA.


---

## 10. Surface B - Operator console (agency + VA)

Mostly built (Section 7). This section specifies the **enhancements** needed to operate the new tenant console and tools, and to reach launch.

### 10.1 Enhancements required for launch

- **Onboarding wizard.** Create a tenant from an intake form: business details, niche, city/state (exclusivity check), plan, seed a draft config from a chosen theme preset + niche presets, create the client's Clerk organization, invite the client user, and queue domain provisioning. Output: a ready-to-edit tenant in minutes.
- **Custom-domain provisioning UI.** Wire Cloudflare for SaaS: add a custom hostname, show DNS instructions (CNAME), poll SSL status, surface `ssl_status` transitions; mark primary domain. Replaces the manual runbook.
- **Change-request management.** Upgrade the read-only queue to a full workflow: view, assign (to a VA), comment, attach files, move through `queued -> in_progress -> preview_ready -> approved -> published`, and link a request to a draft edit + preview. Clients create these from the tenant console; VAs resolve them here.
- **Client user management.** Invite/disable client and client-staff users per tenant; see who has access; resend invites.
- **Report generation control.** Trigger/preview the monthly report per tenant; see send status; edit the "what we did" narrative before it goes out.
- **Billing operations.** Map plans to real Stripe prices; see subscription health across tenants; handle dunning/past-due; issue credits; view MRR roll-up.
- **Cross-tenant lead and review monitoring.** A firm-wide view of new leads and new/negative reviews across all tenants so the operator can react fast (negative review SLA).

### 10.2 Operator dashboard (target)

Portfolio KPIs: total MRR and by tier, active/paused/churned counts, new leads this week across all tenants, reviews needing response, sites with failing SSL or stale publishes, change requests awaiting action, upcoming renewals/past-due. Each tile links into the relevant tenant.

### 10.3 VA workspace

A filtered view for fulfillment: assigned change requests, content tasks (blog posts due), review responses pending, citation/GBP tasks. No billing, no destructive actions (RBAC, Section 14). Every action is logged for the paper trail.

### 10.4 Acceptance criteria (Surface B)

An operator can onboard a new tenant end-to-end (intake -> live site on a custom domain with SSL -> client invited), manage and publish change requests with a preview, and see portfolio-level billing, leads, and reviews.


---

## 11. Surface C - Tenant (client) console

This is the primary new build. It is the business owner's self-serve dashboard and the retention engine. Design bias: **mobile-first, plain language, value-forward.** A client should open it and immediately see "you got N leads worth ~$X, here's what's new."

### 11.1 Access model and architecture

- **Auth:** Clerk **Organizations** - one org per tenant. A client user belongs to their tenant's org; roles `client_admin` (owner) and `client_staff`. Operator users (agency) can impersonate/access any tenant for support (audited). This finally activates the `client` role that `canAccessTenant` was built for.
- **Tenant resolution:** the logged-in user's org maps to exactly one `tenant_id`; all queries scope to it (explicit `tenant_id` + RLS). No tenant switching for clients.
- **Surface placement:** a dedicated route group, e.g. `app.<agency>.com` (org-scoped) or a `/portal` group in the console app, with its own lighter chrome distinct from the operator console. Reuses the same data layer and design tokens, different navigation and permissions.
- **Notifications-first:** because owners live on their phones, every important event (new lead, new review, invoice paid, report ready) is also an email and/or SMS with a deep link back into the console. The console is the system of record; notifications are the daily touchpoint. A PWA install + push is a fast follow.

### 11.2 Tenant dashboard (home)

The "is this worth it?" screen. Above the fold:
- **Leads this month** (count) with trend vs last month, and an **estimated pipeline value** (sum of lead `value_estimate`, or count x average ticket configured per niche).
- **Calls this month** (count, missed vs answered) - from call tracking.
- **Reviews** - current rating + count, and new reviews this month.
- **Site visits** (lightweight count) and top pages.
- **Money** - outstanding client invoices (if using invoicing) and next agency-retainer charge date.
- **What's new from your team** - recent published changes and the latest monthly report.
- Clear primary actions: "Request a change," "Send review requests," "Create invoice," "Add a receipt."

### 11.3 Leads (client view)

The client-facing counterpart to the operator inbox, scoped to their tenant.
- **List + detail**: each lead shows source (form/call/sms/booking), contact info, message, captured page/campaign, status, value estimate, and an **activity timeline** (status changes, notes, calls, SMS).
- **Statuses**: `new -> contacted -> quoted -> won -> lost` (reuse the existing pipeline), editable by the client/staff.
- **Actions**: click-to-call, click-to-text (Twilio), add a note, set value, mark won/lost, assign to a staff member.
- **Won = triggers**: marking a lead "won" can auto-offer a **review request** (Section 12) and, optionally, **create an invoice** - tying lead outcomes to the money and reviews tools.
- **Attribution + reporting**: lead source and page feed the monthly report and the dashboard ROI math.
- **Notifications**: instant new-lead alert (SMS/email) with the lead's details and a one-tap call link. Missed-call leads (from call tracking) appear here too.

### 11.4 Calls (call tracking)

Built on Twilio (the existing voice webhook becomes real).
- A **tracking number** per tenant forwards to the business's real line; every call is logged as a lead/activity with timestamp, caller ID, duration, answered/missed.
- **Recordings** (where consented/legal) with playback; **voicemail** capture; **missed-call -> auto-SMS** ("Sorry we missed you - reply here").
- **Call log** view with filters; calls roll into the dashboard and monthly report.
- Plan-gated: basic call logging on lower tiers, recordings + missed-call text-back on higher tiers.

### 11.5 Requests (change requests to the agency)

Turns the read-only queue into a two-sided workflow.
- Client **creates a request** ("update my hours," "add a new service page," "swap hero photo," "post this special"), optionally with attachments and a target page.
- Tracks status (`queued -> in_progress -> preview_ready -> approved -> published`); when the VA produces a **preview**, the client gets a link to review and an **Approve** button that triggers publish.
- Threaded comments; the client sees who's working it and ETA.
- Reinforces the "unlimited visual adjustments within your plan" promise and creates a paper trail. This is also a churn signal source: lots of unactioned requests = risk.

### 11.6 Billing and payments (the agency retainer)

The client's view of their own subscription, building on the Stripe scaffold.
- **Current plan** (Basic/Growth/Scale), price, status, next charge date, and what's included.
- **Payment method** management via Stripe Billing Portal (no card data touches the Platform).
- **Invoices and receipts**: list of past retainer charges with downloadable PDF invoices/receipts (from Stripe). This satisfies the "manage their payments / invoices / receipts" ask for the retainer side.
- **Plan changes**: request upgrade/downgrade (upgrades self-serve via Checkout; downgrades may route through the operator to manage commitments).
- **Dunning**: clear past-due banner + update-card prompt; grace handling before pause.

### 11.7 Client invoicing (invoice YOUR customers) - Stripe Connect

A high-value tool: the business invoices its **own** customers through the Platform and gets paid by card/ACH. This is the single stickiest feature - the client's cash flow runs through us.
- **Stripe Connect** (Express/Standard) onboarding per tenant; KYC handled by Stripe. Platform optionally takes a small application fee or keeps it free as a retention sweetener (decision in Section 17).
- **Create/send invoices**: line items, taxes, due date, notes; send by email/SMS with a hosted pay link; client customer pays by card/ACH.
- **Track**: draft/sent/viewed/paid/overdue; automatic payment reminders; partial payments/deposits; recurring invoices for service contracts.
- **From a won lead**: one-click "Invoice this customer" prefilled from the lead.
- **Reporting**: paid/outstanding totals feed the dashboard; export for bookkeeping.
- Plan-gated (Growth+); a real differentiator vs a plain website vendor.

### 11.8 Expenses and receipts (records for the bookkeeper)

Positioned explicitly as **record-keeping, not tax advice or filing.**
- **Capture**: snap/upload a receipt (mobile camera or file); store the image in the `media` pipeline.
- **Categorize**: vendor, amount, date, category (fuel, materials, tools, marketing, etc.), payment method, optional note; optional OCR assist to prefill amount/vendor (fast follow).
- **Organize + export**: filter by date/category; export CSV + a PDF receipt pack for a date range to hand to their accountant at tax time.
- **Why it retains**: their financial records accumulate here; leaving means losing their organized receipts. Pairs naturally with client invoicing for a simple income/expense snapshot.
- Compliance copy throughout: "These are records for your bookkeeper. We are not providing tax or accounting advice."

### 11.9 Reviews (reputation engine)

Directly grows the Google Business Profile signal the client cares about and feeds fresh content to the site.
- **Request reviews**: one-tap (or auto on lead "won") SMS/email asking for a Google review with a direct link; templated, throttled to avoid spam.
- **Monitor**: pull in reviews (Google Business Profile API where available; manual/import fallback) with rating + text; alert the operator + client on new and especially **negative** reviews (response SLA).
- **Respond**: draft/post responses (VA-assisted on higher tiers); response templates.
- **Display**: fresh reviews flow into the site's reviews-feed block and `/reviews` page (with `Review`/`AggregateRating` schema), turning reputation into ranking and conversion.
- Plan-gated: request+display on lower tiers; monitoring+managed responses on higher tiers.

### 11.10 Reports (the retainer justifier)

A monthly report, generated by a background job (Inngest), emailed and shown in-console.
- **Contents**: leads (count, sources, trend), calls (answered/missed), reviews (new, rating change), site traffic + top pages, keyword rankings (Section 12), invoices/revenue (if using invoicing), and a plain-language **"what your team did this month"** narrative (pulled from published changes + VA tasks, editable by the operator before send).
- **Framing**: leads with ROI math ("~$X in estimated pipeline for $Y in retainer"). This is the artifact that makes renewal a non-decision.
- **Archive**: all past reports available in the console; PDF export.

### 11.11 Site appearance (light self-serve)

Guardrailed self-serve editing for safe, high-churn-friction fields so clients feel in control without breaking the site or SEO.
- **Direct-edit (auto-publish) safe fields**: business hours, phone, contact email, social links, holiday notices/banners, and swapping gallery photos.
- **Draft -> request -> approve flow** for anything structural (copy, services, layout): edits create a change request with a preview rather than publishing directly.
- All edits validated by the existing Zod layer; everything versioned and reversible. Heavier editing stays operator/VA-driven by design (productization principle).

### 11.12 Appointments / booking (appointment niches)

For dentists, salons, clinics, consultants.
- A **booking widget** on the site (`/book`) writes to an `appointments` table; configurable services, durations, availability windows, buffers.
- Confirmations + reminders via email/SMS (reduce no-shows); optional deposit via Stripe.
- Console view of upcoming/past appointments; optional two-way sync to Google Calendar (fast follow).
- Plan-gated / niche-gated.

### 11.13 Settings and notifications

- **Business profile**: NAP, hours, service areas, logo, brand colors (feeds tokens within guardrails).
- **Team**: invite/manage client-staff users (client_admin only); roles and permissions.
- **Notification preferences**: per-channel (email/SMS/push) per event (new lead, new/negative review, invoice paid, appointment booked, report ready, request updated); quiet hours.
- **Data export**: download leads, invoices, expenses, reviews (CSV) - ownership/trust and a hedge against lock-in complaints.

### 11.14 Acceptance criteria (Surface C)

A client logs into their org-scoped console and can: see a dashboard with leads + ROI + reviews + money; view and work their leads (call/text/note/status); see calls with recordings; create and approve a change request via preview; view their plan, update their card, and download retainer receipts; (Growth+) send a customer invoice and get paid via Stripe Connect; capture and export receipts; request/monitor/respond to reviews and have fresh reviews appear on the site; read the latest monthly report; and edit safe profile fields. Every important event also arrives as a notification with a deep link.


---

## 12. Value-add tools and the retention model

A local business owner cancels when they (a) can't see the value or (b) have nothing tying them to the Platform. Every tool below is selected to fix one or both. Two retention levers:
- **Visible value (V):** makes results obvious -> "this is clearly working."
- **Switching cost (S):** embeds the Platform in daily operations -> "leaving breaks my business."

### 12.1 Tool catalog (tool -> tier -> lever -> effort)

| # | Tool | Lever | Tier | Build effort | Phase |
|---|---|---|---|---|---|
| 1 | Instant lead alerts (SMS/email) + lead inbox | V | Basic | S | 1 |
| 2 | Call tracking (number, log, missed-call alerts) | V | Basic | M | 2 |
| 3 | Call recordings + voicemail + missed-call text-back | V/S | Growth | M | 2 |
| 4 | Reviews: request + display on site | V | Basic | M | 2 |
| 5 | Reviews: monitoring + managed responses | V/S | Growth | M | 2 |
| 6 | Monthly performance report (auto) | V | Basic | M | 2 |
| 7 | Rank tracking ("[service] [city]" keywords) | V | Growth | M | 2 |
| 8 | Client invoicing + card/ACH payments (Stripe Connect) | S | Growth | L | 2 |
| 9 | Recurring invoices / service contracts | S | Scale | M | 3 |
| 10 | Expense + receipt capture, categorize, export | S | Growth | M | 2 |
| 11 | Appointment booking + reminders | V/S | Growth (niche) | L | 2 |
| 12 | Self-serve safe-field editing (hours, photos, banners) | V | Basic | S | 1/2 |
| 13 | Change-request workflow with preview/approve | V | Basic | M | 1/2 |
| 14 | Google Business Profile management/sync | V/S | Scale | L | 3 |
| 15 | Lightweight site analytics + top pages | V | Basic | S | 2 |
| 16 | PWA install + push notifications (mobile app feel) | V/S | Basic | M | 3 |
| 17 | Lead-to-customer pipeline + simple CRM notes | S | Growth | M | 2/3 |
| 18 | Email/SMS marketing blasts to past leads/customers | V/S | Scale | L | 3 |
| 19 | Referral/affiliate tools (refer-a-friend) | V | Scale | M | 3 |
| 20 | Competitor + local-rank snapshot (audit refresh) | V | Scale | M | 3 |

Effort: S = small, M = medium, L = large.

### 12.2 Why each matters (retention rationale, condensed)

- **Lead alerts + inbox (1):** the heartbeat. A trades owner who gets an instant text on every lead never wonders if the site works. Cheapest, highest-impact retention feature; ship first.
- **Call tracking + recordings + text-back (2,3):** most local leads are phone calls. Tracking proves call volume (value), recordings/coaching and missed-call text-back capture revenue the client would otherwise lose (switching cost).
- **Reviews engine (4,5):** more/better Google reviews is the outcome local owners most want; it also feeds ranking and on-site conversion. Managed responses make the agency indispensable.
- **Monthly report (6):** the single artifact that makes renewal automatic. Recaps results + work done in plain language with ROI math.
- **Rank tracking (7):** turns "SEO" from invisible to a chart that moves. Justifies the Growth/Scale premium.
- **Client invoicing + payments (8,9):** the stickiest tool - the client's cash flow runs through the Platform. Pairs with leads ("invoice this won customer") and expenses (income/expense snapshot).
- **Expense/receipt capture (10):** their financial records accumulate here; leaving loses them. Strictly records, not tax advice.
- **Booking (11):** for appointment niches, the booking calendar becomes the front desk - deep operational dependence.
- **Safe-field editing + request workflow (12,13):** control without breakage; satisfies "unlimited adjustments" and gives the client agency.
- **GBP management (14):** owning the client's Google presence is a moat; high effort, high lock-in.
- **Analytics + PWA + CRM + marketing + referrals + competitor snapshots (15-20):** progressive depth that keeps raising switching cost and surfacing value as the relationship matures.

### 12.3 Retention mechanics (the program, not just features)

- **Activation in 7 days:** define first-value as "client logged in AND saw their first lead AND notifications on." Onboarding drives to this; the first lead alert is the aha moment.
- **The value loop:** lead arrives -> instant alert -> client works it in the console -> marks won -> auto review request -> review appears on site -> monthly report recaps it all. Each cycle reinforces "this is working."
- **Switching-cost ladder:** push every client to Growth where invoicing + expenses + reviews + booking live, so their operations - not just their website - run on the Platform.
- **Proactive churn signals (operator side):** flag tenants with zero logins in 30 days, falling lead volume, unactioned change requests, negative reviews, or failed payments; trigger a check-in.
- **Save flows:** at cancel, surface the report + lead count + "what you'd lose" (number, reviews, invoices, receipts) and offer a downgrade/pause instead of cancel.
- **Annual prepay incentive:** discount for annual billing to lengthen commitment and improve cash flow.
- **Exclusivity reminder:** the "one client per niche per city" promise is itself retention - leaving frees the slot for a competitor.


---

## 13. Data model additions

New tables to support Surfaces A and C and the tools. All tenant-scoped tables carry `tenant_id` (FK, cascade) and are added to the RLS `tenant_isolation` policy + the `tenant_tables` array; explicit `tenant_id` filtering remains the source of truth. Follow existing conventions (uuid PKs, timestamptz, enums, indexes, additive Drizzle migrations).

| Table | Purpose | Key columns |
|---|---|---|
| `users` / `memberships` | Map Clerk users to tenants with roles | user id (Clerk), tenant_id, role (`owner`/`staff`/`client_admin`/`client_staff`), status, invited_at |
| `lead_activities` | Timeline for each lead | id, tenant_id, lead_id FK, type (status_change/note/call/sms/email), body, actor, created_at |
| `calls` | Twilio call log + recordings | id, tenant_id, lead_id FK?, twilio_call_sid, from, to, direction, status (answered/missed/voicemail), duration_s, recording_url, created_at |
| `messages` | SMS/email log (text-back, reminders) | id, tenant_id, lead_id?, channel, direction, to, body, status, provider_id, created_at |
| `reviews` | Reviews monitored/displayed | id, tenant_id, source (google/manual), author, rating, body, external_id, responded (bool), response_body, posted_at |
| `review_requests` | Outbound review asks | id, tenant_id, lead_id?, channel, to, status (sent/clicked/completed), sent_at |
| `client_invoices` | Invoices to end customers (Connect) | id, tenant_id, customer_name, customer_contact, status (draft/sent/viewed/paid/overdue/void), currency, subtotal, tax, total, due_date, stripe_invoice_id, hosted_url, paid_at |
| `client_invoice_items` | Invoice line items | id, invoice_id FK, description, qty, unit_amount, amount |
| `expenses` | Receipt/expense records | id, tenant_id, vendor, amount, category, occurred_on, payment_method, note, media_id FK (receipt), created_by |
| `appointments` | Bookings | id, tenant_id, service, customer_name, customer_contact, start_at, end_at, status (booked/confirmed/canceled/no_show), deposit_paid, notes |
| `availability` | Booking windows/rules | id, tenant_id, weekday, start, end, slot_minutes, buffer_minutes, service? |
| `rank_snapshots` | Keyword rank history | id, tenant_id, keyword, city, position, checked_on, source |
| `reports` | Generated monthly reports | id, tenant_id, period (YYYY-MM), payload jsonb, narrative, status (draft/sent), pdf_url, sent_at |
| `posts` | Blog posts (SEO content) | id, tenant_id, slug, title, excerpt, body (rich), cover_media_id, author, status (draft/published), published_at; UNIQUE(tenant_id, slug) |
| `media` | Uploaded assets (photos, receipts, logos) | id, tenant_id, kind, url, width, height, bytes, alt, created_by |
| `notifications` | In-app + delivery log | id, tenant_id, user_id?, type, payload, channels, read_at, created_at |
| `connect_accounts` | Stripe Connect linkage | id, tenant_id, stripe_account_id, charges_enabled, payouts_enabled, onboarded_at |
| `analytics_daily` | Lightweight per-tenant page counts | id, tenant_id, date, path, views, leads |
| `audit_log` | Paper trail for operator/VA + client actions | id, tenant_id?, actor, action, target, metadata, created_at |

Notes:
- `site_configs.pages` stays jsonb for layout/blocks; `posts` is relational for listing/sitemap/RSS. The page-type discriminator (Section 9.1) lives in the page schema.
- Add a `tenant_settings` table or extend `tenants` for hours, notification prefs defaults, average-ticket (for ROI math), and feature flags per tier.
- Generated migrations must be committed (the `drizzle/` folder is tracked). Before production, also create the `sites_reader` role for public reads.

## 14. Roles and permissions (RBAC)

Activate Clerk Organizations (one org per tenant). Roles and a capability matrix:

| Capability | Owner (agency) | Staff/VA (agency) | Client admin | Client staff |
|---|---|---|---|---|
| Manage all tenants | Yes | Scoped to assigned | No | No |
| Edit site config / publish | Yes | Yes (via requests/preview) | Safe fields only | No |
| Approve change request (publish) | Yes | Propose only | Yes (their tenant) | No |
| View leads | All | Assigned | Their tenant | Their tenant |
| Work leads (status/notes/call/text) | Yes | Yes | Yes | Yes |
| Reviews respond | Yes | Yes | Yes | Limited |
| Client invoicing | Yes (support) | No | Yes | Yes |
| Expenses | Yes (support) | No | Yes | Yes |
| Billing / plan / cancel (retainer) | Yes (manage) | No | Yes | No |
| Manage client users | Yes | No | Yes | No |
| Data export | Yes | No | Yes | No |

Enforcement: server actions check role + `canAccessTenant` before any mutation; RLS as defense-in-depth; operator impersonation of a tenant is allowed but written to `audit_log`.

## 15. Integrations

- **Clerk** - auth + Organizations (one org per tenant); client invitations; roles. Degrades in dev.
- **Stripe (Billing)** - agency retainers (built scaffold); wire real prices, invoices/receipts, dunning, annual plans.
- **Stripe Connect** - client invoicing/payments (Express or Standard); KYC by Stripe; optional application fee.
- **Twilio** - tracking numbers, call logging + recordings, SMS (lead alerts, review requests, reminders, text-back). Verify signatures; handle consent/recording laws per state.
- **Email (Resend or similar)** - transactional (lead alerts, invoices, reports, reminders, invites); domain auth (SPF/DKIM).
- **Cloudflare for SaaS** - custom hostnames + SSL provisioning; the add-domain button.
- **Google Business Profile API** - review monitoring/response + profile sync where access is granted; manual/import fallback when not.
- **Rank data source** - a SERP/rank API (e.g., a metered provider) for keyword positions; budget per tenant.
- **Inngest** - background jobs: monthly report generation, review-request sends on "won," rank checks, reminders, dunning nudges, missed-call text-back.
- **Analytics** - server-side per-tenant page counts (privacy-respecting); optional GA4 passthrough.
- **Maps** - embed for contact/area pages (static or lazy to protect performance).


---

## 16. Non-functional requirements

- **Performance:** mobile Lighthouse >= 95 on public sites (existing CI gate); tenant console interactive < 2s on mid-range mobile; only the active font pair downloads; responsive images.
- **Security & isolation:** explicit `tenant_id` on every query + RLS (enabled+forced) on all tenant tables; secrets server-side only; Stripe/Twilio webhook signatures verified; least-privilege roles; operator impersonation audited; `sites_reader` role for public reads before production.
- **Privacy & compliance:** call-recording consent per state; CAN-SPAM/TCPA-compliant SMS/email (opt-out, quiet hours); receipts/expenses labeled "records, not tax advice"; data-export + deletion on request; PCI scope minimized (card data only on Stripe-hosted surfaces).
- **Reliability:** Neon backups + PITR; uptime target 99.9% for sites; health checks + error monitoring (Sentry); ISR so a brief DB blip doesn't take sites down; webhooks idempotent (already, for Stripe).
- **Accessibility:** WCAG 2.2 AA across public sites and consoles.
- **Observability:** structured logs, error tracking, per-tenant audit log, job dashboards (Inngest).
- **Maintainability:** one codebase, data-driven customization, versioned/reversible publishes, generated migrations committed.

## 17. Pricing and packaging

Carry the existing tiers; use the tools as the upgrade ladder. (Numbers indicative; finalize against COGS like Twilio/rank-API per tenant.)

| | Basic (~$249) | Growth (~$599-799) - push here | Scale (~$1,200-2,000) |
|---|---|---|---|
| Multi-page site + hosting + SSL + edits | Yes | Yes | Yes |
| Lead inbox + instant alerts | Yes | Yes | Yes |
| Call tracking | Log + missed-call alert | + recordings + text-back | + call coaching |
| Reviews | Request + display | + monitoring + managed responses | + full reputation mgmt |
| Monthly report | Yes | Yes (richer) | Yes (strategy call) |
| Rank tracking | - | Yes | Yes (competitor view) |
| Client invoicing + payments | - | Yes | + recurring/contracts |
| Expense/receipt capture | - | Yes | Yes |
| Booking | - | Yes (niche) | Yes |
| GBP management | - | - | Yes |
| Marketing blasts / referrals | - | - | Yes |
| Self-serve safe edits | Yes | Yes | Yes |

Levers: annual prepay discount; build fee ($1,500-5,000) or $0-down + higher monthly; add-on custom blocks/pages quoted (L4). Stripe Connect for client invoicing can be free (retention sweetener) or carry a small application fee - recommend free at launch to maximize adoption and switching cost.

## 18. Roadmap (re-planned phases)

Weeks 1-3 delivered the foundation. The plan below replaces the old "Week 4" single step with phases sized to reach launch and then retention depth. Continue the existing one-commit-per-capability cadence, each gated by typecheck+lint+build (bare pnpm) and, where feasible, a runtime smoke against Neon.

**Phase 0 - Decide and publish baseline (now).** Make the push decision on the 4 local commits; confirm CI green; tag the foundation. Wire real Stripe prices.

**Phase 1 - Launch-ready MVP (onboard the first paying client).** Definition of done = a real client on their own domain, logging into a console that shows their leads, getting alerted on new leads, with the agency able to onboard them in < 1 day.
1. **Notifications spine:** Resend + Twilio SMS wired; instant lead alerts (email+SMS) on form and call leads.
2. **Site page system + navigation:** About, services index, service detail, gallery, FAQ, contact, legal, blog scaffold templates; header menu (services/areas dropdowns), footer sitemap, breadcrumbs; theme presets; make the gallery reachable behind auth.
3. **Tenant console v1 (Clerk Orgs):** auth + org-per-tenant + roles; dashboard; leads (view/work/notes/status, call/text); requests (create + approve via preview); billing view + receipts; safe-field profile editing; notification preferences; data export.
4. **Onboarding wizard + custom domains:** intake -> create tenant + seed draft from preset + invite client; Cloudflare for SaaS hostname + SSL UI.
5. **Production hardening:** legal pages, `sites_reader` role, backups/monitoring (Sentry), support/SLA basics.

**Phase 2 - Retention depth (raise visible value + switching cost).**
6. Call tracking (real) + recordings + missed-call text-back.
7. Reviews engine (request/monitor/respond/display) + GBP read.
8. Monthly report generation (Inngest) + rank tracking.
9. Client invoicing + payments (Stripe Connect) + expense/receipt capture.
10. Appointment booking + reminders; lightweight analytics; lead-source attribution end to end.

**Phase 3 - Scale and expansion.**
11. Multi-user client teams polish; PWA + push; recurring invoices/contracts.
12. GBP management/sync; marketing blasts; referral tools; competitor/rank refresh; A/B testing; add-on block marketplace; public API.

## 19. Launch-readiness checklist

Ready to onboard the first paying client when all are true:
- [ ] A client can be onboarded via the wizard in < 1 day (intake -> live site -> invited).
- [ ] The site is multi-page with working navigation and passes mobile Lighthouse >= 95.
- [ ] Custom domain + SSL provision via the UI (no manual runbook).
- [ ] Client logs into an org-scoped console and sees their leads.
- [ ] New leads trigger an instant SMS/email to the client.
- [ ] Client can request a change and approve it from a preview.
- [ ] Retainer billing is live (real prices) with downloadable receipts and dunning.
- [ ] Legal pages present; data export works; backups + error monitoring on.
- [ ] `sites_reader` role in place; RLS verified; webhook signatures verified.
- [ ] A basic support path and SLA exist.

## 20. Success metrics

- **Time-to-onboard:** < 1 day from signed to live (target).
- **Activation:** % of clients who log in AND see a first lead within 7 days (target > 80%).
- **Engagement:** weekly active client logins; notification open/CTR.
- **Lead outcomes:** leads/tenant/month; % marked won; estimated pipeline value surfaced.
- **Reputation:** new reviews/tenant/month; average rating trend; negative-review response time.
- **Retention (the metric that matters):** monthly logo churn (target < 3-4%); net revenue retention (target > 100% via upgrades); average tenant lifetime.
- **Monetization:** % on Growth+; ARPU; client-invoicing adoption; annual-prepay take rate.
- **Reliability:** site uptime; Lighthouse pass rate; report send success.

## 21. Risks and open questions

**Risks.**
- **Founder bandwidth:** Phase 1+2 is a large build for a solo operator; sequence ruthlessly and sell in parallel. Consider a contract dev (the hiring ladder triggers at ~$25k MRR).
- **Stripe Connect complexity:** KYC, liability, and payout edge cases; start with Express and keep flows minimal.
- **Recording/SMS compliance:** state-by-state consent (two-party states), TCPA opt-in; bake consent + opt-out in from day one.
- **GBP API access:** Google access is gated; design review monitoring to degrade to manual/import.
- **Rank-data + Twilio COGS per tenant:** can erode margin on lower tiers; gate to Growth+ and meter.
- **Liability framing on receipts/expenses:** never describe as tax advice; records only.
- **Custom-domain SSL edge cases:** Cloudflare for SaaS hostname verification timing; surface status clearly.
- **Churn if value isn't visible:** the whole thesis - prioritize lead alerts + report early.

**Open questions.**
- Product/brand name and the console domain (`app.<agency>.com`)?
- Tenant console as a subdomain app vs a route group in the existing console app?
- Client invoicing: free vs application fee at launch?
- Which rank/SERP data provider, and keyword budget per tier?
- Blog content: VA-written, AI-assisted, or client-submitted (and approval flow)?
- Average-ticket source for ROI math (per-niche default vs client-entered)?

## 22. Appendix

**A. Current commit state.** `main` ahead of `origin/main` by 4: b6d1567 (console scaffold + Clerk degrade), 235ea85 (leads + Twilio stub), 5b76139 (editor + preview + publish/rollback), d93e2ac (Stripe billing scaffold + subscriptions table). Not pushed. Migration `0002` applied to Neon.

**B. Repo map (high level).** `apps/sites` (public), `apps/console` (operator; tenant console to be added here or as a sibling), `packages/db` (schema/migrations/RLS), `packages/blocks` (registry/renderer/niche catalog), `packages/config` (Zod). `memory.db` (design+state record) at `C:\Users\LENOVO\Downloads\memory.db`.

**C. Customization layers.** L1 tokens (`site_configs.tokens`), L2 pages/blocks (`site_configs.pages`), L3 scoped custom CSS (capped), L4 custom blocks gated by `feature_flags`.

**D. Glossary.** Tenant = a client business (a row). Operator = agency owner/VA. Lead = an inbound prospect for a tenant. Money page = `/<service>/<city>`. Retainer = the tenant's monthly subscription to the agency. Client invoicing = the tenant billing its own customers via Stripe Connect.

**E. Build conventions.** Use bare `pnpm` (not corepack) for `typecheck`/`lint`/`build`; commit generated Drizzle migrations; degrade gracefully without integration keys; explicit `tenant_id` + RLS on every tenant table.

---
*End of PRD v1.0 (draft). This document is the design+intent record; the repo code is the source of truth. Update `memory.db` `next_steps` to reflect the Phase 1 plan once approved.*
