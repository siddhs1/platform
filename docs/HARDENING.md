# Production hardening - build map

_Status: IN PROGRESS 2026-06-14. First slice shipped on `develop` (NOT pushed). Next-steps id 11._

Hardening is mostly infra + security work, and several pieces need owner credentials/decisions (Neon plan, Sentry org, provisioning a prod DB role). This doc tracks what is code (done here, build-verified) vs. owner-gated vs. deferred. Nothing here changes runtime behaviour until the owner opts in.

## H1 -- least-privilege sites read role  `[code done; owner to apply]`
The internet-facing sites app shares the privileged app DB connection today. This narrows the dominant public path (every visitor hits `resolveSite`) to a SELECT-only, 3-table role.
- [x] **H1.1** `packages/db` exposes a second lazy client `readDb` on `SITES_DATABASE_URL ?? DATABASE_URL`. The fallback makes it a no-op until the owner provisions the role; the console keeps using `db` (the RLS-subject app role).
- [x] **H1.2** `apps/sites/src/lib/resolve-site.ts` reads via `readDb`. The public lead-intake (`/api/lead`) still WRITES via the privileged `db` - left on purpose (see H4).
- [x] **H1.3** `packages/db/src/roles.sql` (owner-run, idempotent): `create role sites_reader login; alter role ... bypassrls;` + `grant select` on exactly `tenants`, `domains`, `site_configs`. BYPASSRLS is required because published reads are hostname-keyed/cross-tenant with no `app.tenant_id`; the SELECT-only allowlist means the bypass cannot widen into PII or writes.
- [x] **H1.4** `SITES_DATABASE_URL` declared in `turbo.json` globalEnv + `.env.example`; owner steps in `SETUP_CHECKLIST.md`.
- [ ] **H1.OWNER** Create `sites_reader` in Neon, run `roles.sql`, set `SITES_DATABASE_URL`, redeploy. NOT done here (production security change + Neon-managed credentials).
- VERIFIED: bare `pnpm` typecheck + lint + build green; sites app still resolves via the fallback.

## H2 -- Neon backups / PITR  `[owner]`
- [ ] Enable point-in-time restore on the Neon project; document a restore runbook. Plan-tier dependent; no code.

## H3 -- error monitoring (Sentry)  `[owner decision, then code]`
- [ ] `SENTRY_DSN` is already declared in `turbo.json`. Wiring the Sentry Next.js SDK wraps `next.config` + adds `instrumentation.ts` (a build-config change with a heavy dep) - pick the approach (official SDK vs. a minimal `onRequestError` hook) before implementing. Deliberately not added blind.

## H4 -- deferred
- [ ] `sites_writer` role (INSERT-only on `leads` + `notifications`) so the public lead-intake path is also de-privileged.
- [ ] Broader operator data export (full tenant bundle) beyond the portal leads CSV.
- [ ] Support / SLA process.

## Why this scope
The read-role wiring is safe (a proven no-op until `SITES_DATABASE_URL` is set) and build-verified. Applying the role to the live DB, choosing/adding the Sentry SDK, and enabling PITR are security/infra changes that depend on owner context and credentials, so they are surfaced for the owner rather than done autonomously.
