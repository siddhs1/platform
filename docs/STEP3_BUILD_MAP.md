# Step 3 Build Map -- Tenant (Client) Console v1 (Part B / Surface C)

> **PRD Phase 1 / Step 3.** Status record lives in `memory.db`; the repo is the source of truth.
> Sources: `docs/PRD.md` 11 -- `docs/WIREFRAMES.md` Part B (B0--B14) -- `packages/blocks` (live preview) -- the operator console (Surface B) for shared data layer + format helpers.
> Baseline commit: `7b31c1f` (Step 2 public site page system, shipped). Step 3 builds the client-facing console.

## Architecture decision (2026-06-14)
The client console ships as a **`/portal` route group INSIDE `apps/console`**, not a separate app. It inherits only the root layout (html/body/fonts/Clerk) + its own `portal.css` -- never the operator `(app)` Shell or `globals.css`. It reuses the explicit-tenant data layer (`lib/queries.ts`), `lib/format.ts`, and the DB/auth packages, but renders its own lighter chrome. PRD 11.1 sanctions this; if the agency later wants a standalone `app.agency.com`, the route group lifts out with a redirect (noted for the owner).

## Conventions & guardrails (carry forward)
- **Build/run with BARE `pnpm`**, never corepack. PowerShell flags pnpm's stderr banner as a NativeCommandError falsely -- judge by turbo's "N successful" summary + exit 0. `typecheck` and `build` are SEPARATE calls. Dev/build servers run DETACHED (Win32_Process Create) + poll log + port; do the whole runtime smoke in ONE call (start + poll + curl + teardown).
- **ASCII-only** in every source/doc file; write UTF-8 **no BOM**. Edit the repo ONLY via Windows-MCP (it is on Windows; container tools do not touch it).
- **Tenant isolation is the contract.** Every portal query is scoped to `ctx.tenant.id` from `requirePortal()`; the portal never takes a tenant id from the URL, so there is no id-spoofing surface. New tenant tables get added to `rls.sql`'s `tenant_tables` array (RLS enabled + forced + `tenant_isolation`).
- **RSC boundary**: pure helpers a server module imports must not live in a `'use client'` file. Render client components as JSX (`<Icon/>`), never call them as functions server-side. Console eslint extends ONLY `next/core-web-vitals` -- no `@typescript-eslint/*` disable directives; avoid raw apostrophes/quotes in JSX text (`react/no-unescaped-entities`).
- **Customization stays in data** (L1--L4); no per-tenant `if` branches. `packages/blocks` stays the single renderer shared by sites + the portal's site-appearance preview.
- **Push is approval-gated** -- work on `develop`; `main` = PROD. Commit to develop and push only on the owner's explicit go-ahead; a develop -> main merge is a release.

## Design system (Surface C -- the client portal)
Calm, light, trust-forward, deliberately distinct from the operator console (dark charcoal rail + burnt amber). Light sidebar + topbar -- Trust Blue `#1D4ED8` signal -- ink `#131820` on `#f5f7fa` canvas -- Hanken Grotesk body / Bricolage display -- soft radii (9--14px) -- subtle depth -- mobile bottom tab bar. `--pf-*` tokens in `app/portal/portal.css` (self-contained; only stylesheet on portal routes). WCAG AA, focus-visible, reduced-motion friendly.

## Legend
`[v1]` = launch scope -- `[P2]` = deferred to Phase 2 -- `[x]` done -- `[ ]` not started.

---

## Phase 0 -- RBAC + portal foundation (unblocks all of Step 3)  [DONE]
- [x] **F0.1** `member_role` enum (`owner`/`staff`/`client_admin`/`client_staff`) + `membership_status` enum (`invited`/`active`) + `memberships` table (tenant FK cascade, nullable userId, email, role, status, timestamps; unique (tenant,email); idx (userId)) in `packages/db/src/schema.ts` + relations.
- [x] **F0.2** Add `memberships` to `rls.sql` `tenant_tables` (RLS enabled + forced + `tenant_isolation`).
- [x] **F0.3** Generate + apply migration **0005** (`0005_legal_dragon_man.sql`, purely additive) to Neon; verify columns/enums/RLS/indexes.
- [x] **F0.4** Role model in `lib/clerk.ts`: extend `Role` union + add `isClient()`.
- [x] **F0.5** `lib/portal.ts` -- `PortalContext` + `getPortalContext()` / `requirePortal()`. Clerk path: active org -> tenant by `clerk_org_id` -> role from `memberships` (default `client_admin`). Dev bypass (`CONSOLE_DEV_NO_AUTH=1`, non-prod): bind tenant by `CONSOLE_DEV_PORTAL_SLUG` else oldest tenant, as `client_admin`.
- [x] **F0.V** Verify: bare `pnpm typecheck` (6/6) + console `build` green (`/portal` registered dynamic) + runtime smoke (`/portal` 200 with resolved tenant).

## Phase 1 -- B0 shell + B1 dashboard  [DONE]
- [x] **B0.1** `components/portal/PortalNav.tsx` (`'use client'`) -- sidebar nav + mobile tab bar + inline icon set; items not yet built render dimmed "soon" (no 404s); nav badge for new leads.
- [x] **B0.2** `components/portal/PortalShell.tsx` (server) -- desktop sidebar (brand = business name + "Client console", nav, user chip, Clerk SignOut) + topbar (business name, disabled bell, avatar) + mobile bottom tab bar.
- [x] **B0.3** `app/portal/portal.css` -- self-contained light theme + `--pf-*` tokens + shell/nav/topbar/tabbar + dashboard classes; responsive (<=860px hides sidebar, shows bottom tabs).
- [x] **B0.4** `app/portal/layout.tsx` (force-dynamic) -- `requirePortal()` -> `newLeadCount()` -> `PortalShell`.
- [x] **B1.1** `lib/portal-queries.ts` -- `getDashboard()` (leads this/last month, calls this month, est. pipeline + count, per-day sparkline, recent leads, what's-new from `config_versions`, `hasAnyData`) + `newLeadCount()`.
- [x] **B1.2** `app/portal/page.tsx` (force-dynamic) -- greeting + period chip; KPI cards (Leads w/ trend + sparkline, Calls, Reviews [P2] "soon", Est. pipeline); recent-leads mini-list + what's-new feed; quick-action buttons (disabled until their screens ship); plan/next-charge money strip; first-run empty-state checklist when no data.

## Phase 2 -- B2 leads list + B3 lead detail  `[v1]`  [DONE 2026-06-14]
> Shipped via Windows-MCP on `develop` (migration 0006 applied to Neon + verified). Deferred, non-blocking: the Kanban pipeline board view, the date-range filter, and true optimistic UI (status changes use a JS-free form server action + `revalidatePath`, not client-side optimistic update).
- [x] **B2.0** Migration **0006** (`0006_free_roland_deschain.sql`, additive): `lead_activity_kind` enum (`note`/`status_change`) + `lead_activities` table (tenant FK cascade, lead FK cascade, kind, body, actor, createdAt) + 2 indexes; added to `rls.sql` `tenant_tables` (RLS enabled+forced+`tenant_isolation`). Applied + verified on Neon (7 cols, RLS forced, policy, indexes, enum).
- [x] **B2.1** Leads list (`/portal/leads`): status tabs w/ counts + source filter + search (name/phone/email/message) + server-side pagination (25/page); row = status dot + name/phone + status tag + source + message snippet + value + age + chevron -> detail; tenant-scoped via `requirePortal()`. (Date filter + Kanban view deferred.)
- [x] **B2.2** Status workflow (new -> contacted -> quoted -> won/lost) via a form server action; every change appends a `status_change` activity (with actor); nav `Leads` badge reflects the `new` count.
- [x] **B3.1** Lead detail (`/portal/leads/[leadId]`): contact (click-to-call / text / email), source + received-at, editable estimated value (logged), message, status dropdown + Mark won/lost; activity timeline (status changes + notes + synthetic "created"); add-note composer; won reveals review/invoice CTAs (disabled, arrive in Phase 2 retention work).
- [x] **B2.V** Flipped `Leads` nav `enabled`; bare `pnpm typecheck` 6/6 + `lint` 2/2 + production `build` 2/2 green (both new routes registered dynamic). NOTE: a full authed `/portal` runtime smoke is not possible headlessly now that real Clerk keys are live -- it needs a signed-in client session (the B14 invitation flow). Data layer: `apps/console/src/lib/portal-leads.ts`; actions: `app/portal/leads/actions.ts`.

## Phase 3 -- B4 requests list + B5 request create/approve  `[v1]`  [DONE 2026-06-14]
> Shipped on `develop` (NO migration -- reuses `change_requests`). The portal is the first surface that CREATES change_requests (the operator editor only listed them). Type + target page are encoded into `description` as a "[kind | page]" header (parsed back for display) since the table has no kind/page columns. Deferred, non-blocking (would need a migration / storage): a threaded conversation, file attachments, a per-request live configDiff preview, an assignee, and an updated-at timestamp. Approve/decline drive status; the actual publish stays operator-mediated via the Step 2 publish/version flow.
- [x] **B4.1** Requests list (`/portal/requests`): Open/Completed tabs with counts; rows = status dot + derived title + type/page chips + status pill + age + "Action needed" flag when `preview_ready` + chevron -> detail; tenant-scoped via `requirePortal()`. (Uses `createdAt`; no assignee/updated-at column.)
- [x] **B5.1** Create request (`/portal/requests/new`): type select (Content/Photo/New page/Business info/Other) + optional target-page select + free-text; writes a `change_requests` row (status `queued`, requestedBy = client actor). Attachments noted as coming soon.
- [x] **B5.2** Approve path (`/portal/requests/[requestId]`): status-driven explainer; when `preview_ready`, Approve-and-publish (-> `approved`) or Request-changes (-> `in_progress`); approved/published show a confirmation. A live configDiff preview in the portal + the final publish are operator-mediated (operator stages `configDiff` and publishes via the Step 2 flow). Conversation thread + attachments deferred.
- [x] **B4.V** Flipped `Requests` nav `enabled`; bare `pnpm typecheck` 6/6 + `lint` 2/2 + production `build` 2/2 green; routes `/portal/requests`, `/portal/requests/new`, `/portal/requests/[requestId]` registered dynamic. NOTE: a full authed `/portal` runtime smoke is not possible headlessly (real Clerk keys live). Data layer: `apps/console/src/lib/portal-requests.ts`; actions: `app/portal/requests/actions.ts`.

## Phase 4 -- B6 billing + receipts  `[v1]`  [DONE 2026-06-14]
> Shipped on `develop` (NO migration -- reuses the Stripe scaffold + the subscriptions table from 0002). Client view is read + manage-only: plan/status/next-charge + a Stripe Billing Portal link + read-only receipts. Starting a NEW subscription stays an onboarding/operator action (not exposed in the portal). Degrades cleanly when Stripe is not configured. Live Stripe data could not be exercised here (no STRIPE_* keys in this env); the degraded path + build are verified.
- [x] **B6.1** Billing page (`/portal/billing`): plan card = plan label + subscription status badge + next-charge date (from the subscriptions row the webhook keeps current); "Manage billing" button -> Stripe Billing Portal (`createPortalBillingPortal`, return_url back to /portal/billing) where the client updates the card / views invoices on Stripe-hosted pages; disabled with a notice when Stripe is unconfigured or there is no customer yet; past_due/unpaid + not-configured banners. Reuses `lib/billing.ts` (planLabel/subscriptionStatusLabel) + `lib/stripe.ts` (stripeEnabled/getStripe).
- [x] **B6.2** Receipts (read-only): lists the customer Stripe invoices (date, amount, status, View -> invoice_pdf/hosted_invoice_url in a new tab); never fails the page on a Stripe read (try/catch -> empty); empty state when none / not active.
- [x] **B6.V** Flipped `Billing` nav `enabled` (desktop sidebar; intentionally left OFF the mobile tab bar, which already holds 5 items); bare `pnpm typecheck` 6/6 + `lint` 2/2 + production `build` 2/2 green; `/portal/billing` registered dynamic. Data layer: `apps/console/src/lib/portal-billing.ts`; action: `app/portal/billing/actions.ts` (errorRedirect:never composed via .catch, mirrors the operator billing action).

## Phase 5 -- B12 site appearance  `[v1]`
- [ ] **B12.1** Safe-field site editor: business profile (hours, phone, service areas, social links), theme preset choice, logo/hero text -- token/data-level only (L1--L2). Live preview via `packages/blocks`.
- [ ] **B12.2** Save -> new `config_version` (draft) -> publish (reuses Step 2 publish flow); appears in the dashboard "what's new" feed.
- [ ] **B12.V** Flip `Your Site` nav; verify edit -> preview -> publish; build + smoke.

## Phase 6 -- B13 notifications + B14 account & data  `[v1]`
- [ ] **B13.1** Notification settings: edit `tenants.notify_email` / `notify_phone` + per-channel toggles (`notify_*`); test-send (degrades without Resend/Twilio keys).
- [ ] **B14.1** Account & team: list `memberships` for the tenant; invite teammate (writes a `memberships` row, sends Clerk invite when keys exist); role display.
- [ ] **B14.2** Data export: CSV of leads (tenant-scoped); account/business details view.
- [ ] **B6.V** Flip `Settings` nav; verify notify writes + member list + CSV export; build + smoke.

## Phase 7 -- Acceptance & housekeeping
- [ ] **ACC.build** -- bare `pnpm typecheck` + `lint` + `build` green (NOT corepack), each commit.
- [ ] **ACC.routes** -- every `[v1]` portal route renders for a resolved tenant; tenant isolation holds (no cross-tenant reads); disabled items never 404.
- [ ] **ACC.a11y** -- keyboard nav, focus-visible, AA contrast, reduced-motion; mobile tab bar + sign-out reachable on mobile (lands with B14 settings).
- [x] **HK.docs** -- commit this map; keep `SETUP_CHECKLIST.md` (Clerk orgs / invitations / post-auth routing) in sync.
- [x] **HK.memory** -- update `memory.db` `build_status` / `next_steps` / `notes` / `meta` for the portal foundation.
- [ ] **HK.commit** -- commit in logical chunks (foundation -> leads -> requests -> billing -> site -> settings). Push only on explicit owner OK.

---

_Last updated: 2026-06-14 (Phases 2-4: leads, requests, billing shipped). Maintained alongside `docs/PRD.md`, `docs/WIREFRAMES.md`, `docs/STEP2_BUILD_MAP.md`, and `memory.db`._
