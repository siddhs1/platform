# Owner Setup Checklist -- things Claude can't do for you

This file tracks everything that must be set up by **you** (accounts, API keys, DNS,
deploys, payments, real content) because Claude either cannot do it from this
environment or shouldn't do it without you. Claude keeps this file current: whenever a
new "blocked-on-owner" item appears during the build, it gets added here, and a pointer
to this file lives in `memory.db` (`meta.setup_checklist`) so it survives across sessions.

**Status legend**
- `[SET]` -- already configured and working
- `[DEV-STUB]` -- works in local dev via a degrade/bypass; real credentials needed before production
- `[NEEDED]` -- required for the related feature to function at all
- `[LATER]` -- not needed yet; belongs to a later phase (noted per item)
- `[APPROVAL]` -- Claude can do it, but only with your explicit go-ahead

Where a key lives: all of these are environment variables (see `.env` / `.env.example`
at the repo root) unless stated otherwise.

---

## 0. Approvals -- actions Claude will not take on its own
- [ ] `[APPROVAL]` **Git push / merge to main.** Claude commits locally on `develop` and pushes only on your explicit go-ahead. Branch model: `develop` = active work, `main` = PROD; both currently in sync at the latest `develop` commit (see `memory.db` `head_commit`). A `develop` -> `main` merge is a release. CI runs typecheck/lint/build + a Lighthouse audit (needs the DB secrets in section 5).
- [ ] `[APPROVAL]` **Any payment or paid signup** (domain purchase, paid plan upgrades, phone-number purchase, etc.). Claude will tell you what to buy; you do the transaction.
- [ ] `[APPROVAL]` **Production deploys / DNS cutover.** Claude prepares everything; you trigger the actual go-live.

## 1. Database -- Neon Postgres
- [x] `[SET]` **`DATABASE_URL`** (pooled, runtime) and **`DIRECT_URL`** (direct, migrations). Working -- migrations `0000`--`0004` are applied and the demo data is seeded.
- [ ] `[LATER]` **Production database branch/instance.** For go-live you'll likely want a separate Neon branch (or project) for prod, plus backups/PITR enabled (Phase 1 Step 5 hardening).

## 2. Console authentication -- Clerk
- [x] `[DEV-STUB]` Local dev can run with `CONSOLE_DEV_NO_AUTH=1` (stub owner session) when **no** Clerk keys are set. Real Clerk keys are now in `.env`, so this bypass is **inert** (`clerkEnabled` takes precedence) and the console always uses real auth -- the desired behavior. Must be empty/unset in any deployed environment.
- [x] `[NEEDED]` Create a Clerk application and set **`CLERK_SECRET_KEY`** + **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**. Without these the console degrades (no real auth).
- [x] `[SET]` **Clerk Organizations** enabled (one org per tenant). `force_organization_selection` is OFF so operators are not forced into an org. Client roles (`client_admin`/`client_staff`) live in the `memberships` table (migration 0005), NOT in Clerk -- so the paid Custom-Roles add-on is not needed. A tenant's `clerk_org_id` links it to its org. Verified: the `demo-roofing` tenant is linked to a real org and resolves as `client_admin`. **Operator roles** (`owner`/`staff`) are set on the Clerk user's `publicMetadata.role` via the Backend API/dashboard (the first operator account was set to `owner`).
- [x] `[DEV-STUB]` Portal dev bypass (`CONSOLE_DEV_NO_AUTH=1` + optional **`CONSOLE_DEV_PORTAL_SLUG`**) binds the portal to one tenant as `client_admin` -- only when **no** Clerk keys are set; **inert** now that real keys exist. With real auth, viewing `/portal` requires a user whose active Clerk org maps to a tenant (the client invitation/accept flow, B14). Must be empty/unset in any deployed environment.
- [x] `[SET]` **Post-sign-in routing.** Everyone lands on `/post-auth` (Clerk `SIGN_IN_FORCE_REDIRECT_URL`), which routes operators to `/` and clients (active org -> tenant) to `/portal`. Unauthenticated -> `/sign-in`; signed-in-but-unlinked -> a terminal "account pending setup" page (no redirect loop). Enforced in `lib/auth.ts` (`requireSession`) + `lib/portal.ts` (`requirePortal`).
- [ ] `[NEEDED]` **Client invitations.** Invite client users into their tenant's Clerk org (writes a `memberships` row) from the console -- lands with B14 (Account & team). Operator impersonation of a tenant should be audited (Step 5 / `audit_log`).

## 3. Billing -- Stripe (agency's own retainers)
- [ ] `[NEEDED]` Create a Stripe account; set **`STRIPE_SECRET_KEY`**. Without it the billing page shows a "not configured" notice and the webhook returns 400 (by design).
- [ ] `[NEEDED]` Create a webhook endpoint and set **`STRIPE_WEBHOOK_SECRET`** (point it at `/api/stripe/webhook` on the console app).
- [ ] `[NEEDED]` Create products/prices for the three plan tiers and set **`STRIPE_PRICE_BASIC`**, **`STRIPE_PRICE_GROWTH`**, **`STRIPE_PRICE_SCALE`** to the resulting price IDs.

## 4. Notifications -- new-lead alerts
Each channel degrades independently (unset keys = that channel is skipped, never a crash).
- [ ] `[NEEDED]` **Email via Resend** -- set **`RESEND_API_KEY`** and **`RESEND_FROM`** (verify a sending domain in Resend).
- [ ] `[NEEDED]` **SMS via Twilio** -- set **`TWILIO_ACCOUNT_SID`**, **`TWILIO_AUTH_TOKEN`**, **`TWILIO_FROM_NUMBER`** (buy a number). The same Twilio number backs the call-tracking voice webhook.
- [ ] Note: per-tenant recipients live on the tenant row (`notify_email` / `notify_phone`) and are edited in the console (Notifications screen, Step 3).

## 5. CI / GitHub Actions
- [x] `[SET]` Repo pushed to GitHub (github.com/siddhs1/platform); `main` + `develop` branches tracked.
- [ ] `[NEEDED]` In the GitHub repo settings, add **Actions secrets `DATABASE_URL` and `DIRECT_URL`** -- the Lighthouse CI job needs them (the build itself passes without DB secrets thanks to the lazy client). Confirm the workflow is green on the first push.

## 6. Custom domains -- Cloudflare for SaaS (Step 4)
- [ ] `[LATER]` Set **`CLOUDFLARE_API_TOKEN`** + **`CLOUDFLARE_ZONE_ID`** for the onboarding flow that provisions client custom hostnames + SSL.
- [ ] `[LATER]` **Agency apex domain** registered and pointed; set **`NEXT_PUBLIC_SITES_HOST`** to that apex (dev value is `localhost:3000`). Client domains CNAME to this apex.
- [ ] `[LATER]` Per-client DNS: each client points their domain (CNAME) to the apex; you'll hand them the DNS instructions the onboarding flow generates.

## 7. Hosting / deployment
- [ ] `[LATER]` Choose a host (Vercel fits Next.js 15) and deploy **two apps**: the sites app and the console app.
- [ ] `[LATER]` Set **all** env vars above in the host for each app's environment.
- [ ] `[BEFORE DEPLOY]` Set **`GALLERY_ACCESS_TOKEN`** (any strong random string) in the **sites** app env to gate the internal theme gallery at `/internal/gallery` (open in dev; in production it 404s unless `?key=<token>` matches). Layering host-level auth or an IP allowlist in front of `/internal/*` is recommended.
- [ ] `[LATER]` Run DB migrations against the production database as part of the deploy.

## 8. Monitoring (Step 5 hardening)
- [ ] `[LATER]` Create a Sentry project and set **`SENTRY_DSN`** for error monitoring.

## 9. Real client content & assets (per onboarded client)
The three demo tenants use deliberately fake data (555 phone numbers, `.example` emails, placeholder copy). Real clients need:
- [ ] `[NEEDED per client]` Business profile: real name, phone, email, full address (NAP), hours, license number, "insured" status, social links. (Stored in `tenants.business_profile`; entered at onboarding / in the console.)
- [ ] `[NEEDED per client]` Brand + imagery: logo, hero/gallery photos, real service descriptions, real reviews/testimonials. (If you want hosted images rather than text logos, we'll also need an image hosting/CDN decision.)

## 10. Legal copy (Step 5)
- [ ] `[NEEDED]` Privacy, Terms, and Accessibility page content. Claude can scaffold the pages and provide drafts, but final legal text should be reviewed/approved by you (and ideally counsel).

---

_Last updated: 2026-06-14. Maintained alongside `docs/STEP2_BUILD_MAP.md`, `docs/STEP3_BUILD_MAP.md`, and `memory.db`._
