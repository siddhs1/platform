-- ---------------------------------------------------------------------
-- Row-Level Security
-- Applied AFTER the drizzle-generated migration. drizzle-kit does not
-- emit RLS, so this runs as a follow-up step (migrate.ts applies it).
--
-- Isolation model: every tenant-scoped table is filtered by
-- current_setting('app.tenant_id'), which the console sets per request
-- via setTenantContext(). Reads with no context return nothing, which
-- is the safe default.
-- ---------------------------------------------------------------------

-- Helper: read the current tenant from the connection setting.
create or replace function app_current_tenant() returns uuid as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid;
$$ language sql stable;

-- Macro-style policy applied to each tenant-scoped table.
do $$
declare
  t text;
  tenant_tables text[] := array[
    'domains',
    'site_configs',
    'config_versions',
    'leads',
    'change_requests',
    'subscriptions',
    'notifications',
    'memberships'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);

    execute format(
      'drop policy if exists tenant_isolation on %I;', t
    );
    execute format($f$
      create policy tenant_isolation on %I
        using (tenant_id = app_current_tenant())
        with check (tenant_id = app_current_tenant());
    $f$, t);
  end loop;
end $$;

-- tenants table: a tenant can see only its own row.
alter table tenants enable row level security;
alter table tenants force row level security;
drop policy if exists tenant_self on tenants;
create policy tenant_self on tenants
  using (id = app_current_tenant())
  with check (id = app_current_tenant());

-- NOTE: the sites app uses a separate DB role (sites_reader) that
-- bypasses RLS for published-config reads only, since it serves public
-- pages by hostname and has no tenant session. Grant it SELECT on
-- domains, site_configs (state='published' enforced in query), and
-- tenants. The console role (app_user) is subject to all policies above.
