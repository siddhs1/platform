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

## Phase 5 -- B12 site appearance  `[v1]`  [DONE 2026-06-14]
> Shipped on `develop` (NO migration). Safe-field only: the portal edits business profile (scalar fields + socials) and picks a curated THEME_PRESET; it never exposes raw token JSON or custom CSS. Theme apply is one step (update draft tokens + publish via the Step 2 flow) for a friendly client UX; a separate draft-stage-then-publish two-step is possible later. Hours + service areas editing deferred (need a repeatable-row editor) -- noted in-UI as "edited via a request for now".
- [x] **B12.1** `/portal/site`: theme preset picker (THEME_PRESETS radio cards with color swatches + current-marker) + a safe business-details form (tagline, phone, email, license number, licensed-and-insured toggle, 4 social URLs). LIVE PREVIEW via a chrome-less `/portal-preview` route that renders the DRAFT through `@platform/blocks` (the exact production renderer; tenant from the session, never the URL) embedded in an iframe + an "Open in new tab" link. Business profile -> `tenants.business_profile`; theme -> L1 tokens. Logo upload deferred (no asset storage yet).
- [x] **B12.2** Apply theme: validates `{tokens, pages, customCss, featureFlags}` with `siteConfigSchema`, writes the draft (`updateDraftConfig`) then publishes via `publishConfig` (+ a `config_versions` snapshot + host-cache bust), so it lands in the dashboard "what is new" feed. Business details save immediately to the tenant row + bust the host caches (live within the ISR window).
- [x] **B12.V** Flipped `Your Site` nav `enabled`; bare `pnpm typecheck` 6/6 + `lint` 2/2 + production `build` 2/2 green; `/portal/site` + `/portal-preview` registered dynamic. Data layer: `apps/console/src/lib/portal-site.ts` (updateBusinessProfile + matchPresetId); actions: `app/portal/site/actions.ts` (saveBusinessDetails + applyTheme). NOTE: full authed `/portal` runtime smoke not feasible headlessly (real Clerk keys live).

## Phase 6 -- B13 notifications + B14 account & data  `[v1]`  [DONE 2026-06-14]
> Shipped on `develop` (NO migration). All on `/portal/settings`. Test-send + the email invite degrade cleanly when Resend/Twilio/Clerk are unconfigured.
- [x] **B13.1** Notifications: edit `tenants.notify_email` / `notify_phone` + per-channel toggles (`notify_email_enabled` / `notify_sms_enabled`); a "Send a test" button fires `@platform/notify` notifyNewLead to the saved recipients (channels without provider keys return a skipped outcome). Data: `lib/portal-settings.ts` updateNotifyPrefs.
- [x] **B14.1** Account & team: lists `memberships` for the tenant (email + role + invited/active badge); invite form writes a `memberships` row (upsert on (tenant,email), status invited) and best-effort sends a Clerk org invitation when keys + org exist. Data: `lib/portal-team.ts` listMembers + createInvite.
- [x] **B14.2** Data export: `/portal/settings/export` route handler streams the tenant leads as CSV (`leadsToCsv`, tenant from the session); account/business details view on the page. Mobile-reachable sign-out added to the account section (Clerk SignOutButton, gated by clerkEnabled) since the sidebar is hidden on mobile.
- [x] **B6.V** Flipped `Settings` nav `enabled`; bare `pnpm typecheck` 6/6 + `lint` 2/2 + production `build` 2/2 green; `/portal/settings` + `/portal/settings/export` registered dynamic. Actions: `app/portal/settings/actions.ts` (saveNotifications / sendTestNotification / inviteTeammate).

## Phase 7 -- Acceptance & housekeeping  [DONE 2026-06-14]
- [x] **ACC.build** -- bare `pnpm` (never corepack) typecheck 6/6 + lint 2/2 + production build 2/2 green on every Step 3 commit; final build registers all 11 portal routes dynamic (/portal, /portal-preview, /portal/leads(+[leadId]), /portal/requests(+/new,+[requestId]), /portal/billing, /portal/site, /portal/settings(+/export)).
- [x] **ACC.routes** -- all `[v1]` portal routes registered + compiled; tenant isolation holds by construction (every portal read/write scopes to ctx.tenant.id from requirePortal(); no tenant id is taken from the URL; writes match (id AND tenant_id)); disabled nav items render as dimmed spans (never links), so they cannot 404. NOTE: a full authed runtime render could not be exercised headlessly because real Clerk keys are live (dev bypass inert); the build + isolation-by-construction are the gate.
- [x] **ACC.a11y** -- focus-visible ring on all portal links/buttons (portal.css); form fields carry labels (htmlFor) or aria-label; forms + links are keyboard-operable (form server actions, next/link); minimal motion (no animations beyond hover/transition); AA-contrast trust-blue palette carried from Step 2; mobile bottom tab bar present + a mobile-reachable Sign out added to /portal/settings (sidebar sign-out is hidden on mobile).
- [x] **HK.docs** -- commit this map; keep `SETUP_CHECKLIST.md` (Clerk orgs / invitations / post-auth routing) in sync.
- [x] **HK.memory** -- update `memory.db` `build_status` / `next_steps` / `notes` / `meta` for the portal foundation.
- [x] **HK.commit** -- committed in logical chunks on develop (foundation -> auth -> leads -> requests -> billing -> site -> settings); HELD pending owner OK to push.

---

_Last updated: 2026-06-14 (Step 3 client console v1 COMPLETE: B0-B6/B12-B14 + acceptance; all on develop, held). Maintained alongside `docs/PRD.md`, `docs/WIREFRAMES.md`, `docs/STEP2_BUILD_MAP.md`, and `memory.db`._
