-- ---------------------------------------------------------------------
-- Least-privilege role for the PUBLIC sites app (production hardening).
--
-- The internet-facing sites app serves published pages by hostname and has
-- no tenant session. Today it shares the privileged app connection; this
-- role narrows its blast radius to SELECT on exactly the three tables the
-- published read path touches, with BYPASSRLS so hostname-keyed reads work
-- without an app.tenant_id context. It can read NO PII (leads, notifications,
-- memberships, change_requests, ...) and can WRITE nothing.
--
-- OWNER-RUN -- deliberately NOT applied by migrate.ts: role creation +
-- credentials are managed in Neon. Steps:
--   1. Create the role (Neon console gives it a connection string), or run
--      the CREATE ROLE below and then: alter role sites_reader password '...';
--   2. Run this file against the database (idempotent; safe to re-run).
--   3. Set SITES_DATABASE_URL to the sites_reader connection string and
--      redeploy the sites app. Until then the app falls back to DATABASE_URL,
--      so behaviour is unchanged (see packages/db/src/index.ts readDb).
--
-- NOTE: the public lead-intake (POST /api/lead) WRITES leads + notifications
-- and deliberately stays on the privileged app connection for now. A future
-- `sites_writer` with INSERT-only on (leads, notifications) would de-privilege
-- that path too.
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'sites_reader') then
    create role sites_reader login;
  end if;
end $$;

-- Published reads are hostname-keyed and cross-tenant (no app.tenant_id is
-- set), so this role bypasses RLS. The SELECT-only, 3-table allowlist below
-- means the bypass cannot widen into PII tables or any write.
alter role sites_reader bypassrls;

-- Start from zero, then grant exactly the published read path. A column later
-- added to these tables is covered automatically by the table-level grant.
revoke all on all tables in schema public from sites_reader;
grant usage on schema public to sites_reader;
grant select on table tenants to sites_reader;
grant select on table domains to sites_reader;
grant select on table site_configs to sites_reader;
