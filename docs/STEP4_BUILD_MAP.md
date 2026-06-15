# Step 4 build map - operator onboarding + custom domains

_Status: DONE 2026-06-14. Shipped on `develop` (NOT pushed). No migration (reuses tenants / site_configs / domains)._

Operator-side (the console `(app)` group, NOT the `/portal` client surface). Turns a fresh client into a live-ready tenant: claim a niche+city, seed a starter site, wire auth, and attach a domain. External services (Cloudflare for SaaS, Clerk org/invites) degrade cleanly when their keys are absent - the same pattern as the Stripe/Resend/Twilio wiring.

## C1 -- onboarding wizard  `[done]`
- [x] **C1.1** Intake form at `/onboarding` (operator-only): business name, slug (auto from name), niche (curated `NICHE_OPTIONS`), city, state, plan, starter theme (`THEME_PRESETS`), optional primary hostname, optional client email. Reuses the operator console form classes (card / field / field-group / field-row / input / btn). Sidebar gains an `Onboard` link.
- [x] **C1.2** Exclusivity: `checkExclusivity(niche, city, state)` blocks a second client in the same niche+city+state (the unique index is the backstop); slug uniqueness checked too. Friendly error naming the conflicting business.
- [x] **C1.3** Create: `createTenant` inserts the tenant (status `onboarding`) + seeds draft & published `site_configs` from the chosen preset tokens + a starter home page (blocks self-populate from niche/city). Primary domain row created (localhost -> active; a real hostname goes through Cloudflare, see C2).
- [x] **C1.4** Auth: `provisionClerkOrg` best-effort creates a Clerk org, links `tenants.clerk_org_id`, writes a `client_admin` membership row, and sends a client `org:admin` invitation - all guarded so onboarding works without Clerk keys. Redirects to the new tenant overview (`?onboarded=1`).
- DATA: `apps/console/src/lib/onboarding.ts`. ACTION: `app/(app)/onboarding/actions.ts` (`onboardClient`). PAGE: `app/(app)/onboarding/page.tsx`.

## C2 -- custom domains  `[done]`
- [x] **C2.1** Domains tab on the tenant (`/tenants/[tenantId]/domains`); `TenantTabs` gains `Domains`. Lists hostnames with primary + SSL-status badges (active/pending/failed -> status-live/onboarding/paused).
- [x] **C2.2** Add a custom hostname: normalizes input, rejects duplicates, and (when Cloudflare is configured + not localhost) calls Cloudflare for SaaS `createCustomHostname`, storing `cf_hostname_id` + mapped `ssl_status`. DNS-instructions card shows the CNAME target (`dnsTarget()`).
- [x] **C2.3** Refresh: re-reads a hostname's SSL status from Cloudflare (`getCustomHostnameStatus`) and updates the row. Degrades to manual instructions + pending status without keys.
- DATA: `apps/console/src/lib/cloudflare.ts` (lazy, never-throws) + `apps/console/src/lib/domains.ts`. ACTIONS: `app/(app)/tenants/[tenantId]/domains/actions.ts` (`addDomain`, `refreshDomain`). PAGE: `app/(app)/tenants/[tenantId]/domains/page.tsx`.

## Acceptance
- [x] Bare `pnpm` typecheck 6/6 + lint 2/2 + production build 2/2 green; `/onboarding` + `/tenants/[tenantId]/domains` registered dynamic.
- [x] No migration. `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` were already in `turbo.json` globalEnv; added `CLOUDFLARE_CNAME_TARGET` + documented all three in `.env.example` + `SETUP_CHECKLIST.md`.
- [x] NOTE: live runs (creating a real tenant, real Clerk org/invite, real Cloudflare hostname) were NOT exercised here - no Cloudflare keys in this env and tenant creation is a side effect; the build + the degrade paths are the gate. The owner can smoke-test onboarding against the dev Clerk instance.

## Next
Production hardening (next_steps id 11): dedicated `sites_reader` Postgres role for published reads, Sentry, Neon backups/PITR, broader data export, support/SLA. Onboarding polish later: logo/asset upload, multi-step wizard UX, set-primary / remove-domain controls, verify-before-publish.
