# Platform - Multi-Tenant Site System

One codebase, one database. A client is a row, not a server. This repo is
the **Week 1 + early Week 2 foundation**: the database spine, hostname
routing, the block/token system, and three seeded demo sites.

## What's here

```
platform/
-- apps/
|  -- sites/            # the public multi-tenant site renderer (Next.js)
|  |  -- src/
|  |     -- middleware.ts                     # hostname -> /_sites/[host] rewrite
|  |     -- app/_sites/[host]/[[...path]]/    # the renderer
|  |     -- app/api/lead/                     # public lead intake
|  |     -- lib/resolve-site.ts               # hostname -> published config (cached)
|  -- console/          # admin console - scaffolded, built in Week 3
-- packages/
|  -- db/               # Drizzle schema, migrations, RLS, seed   <- the spine
|  -- blocks/           # block registry + tokens + JSON-LD       <- Week 2 heart
|  -- config/           # Zod validation (a bad config never ships)
-- turbo.json, pnpm-workspace.yaml, tsconfig.base.json
```

## The customization model (locked)

Everything a client can look like lives in **data**, never code:

| Layer | Where | Included? |
|---|---|---|
| L1 design tokens | `site_configs.tokens` | yes |
| L2 page/blocks | `site_configs.pages` | yes |
| L3 scoped CSS | `site_configs.custom_css` (capped 4KB) | yes |
| L4 custom blocks | `site_configs.feature_flags` gates registry blocks | quoted |

The `@platform/blocks` registry is the single source of truth: the sites
app renders published config through it; the console (Week 3) will render
the same components against draft config for live preview.

## Prerequisites

- Node 20+
- pnpm 9 (`corepack enable && corepack prepare pnpm@9 --activate`)
- A Neon Postgres database (free tier is fine)

## Setup

```bash
pnpm install
cp .env.example .env          # fill in DATABASE_URL and DIRECT_URL from Neon

pnpm db:generate              # generate the SQL migration from schema.ts
pnpm db:migrate               # apply migration + RLS policies
pnpm db:seed                  # create 3 demo tenants
```

## Run the Week 1 acceptance test

```bash
pnpm --filter @platform/sites dev
```

Then visit - these resolve as localhost subdomains, no hosts-file edit
needed in modern browsers:

- http://demo-roofing.localhost:3000  (sharp / navy+amber / Archivo)
- http://demo-dental.localhost:3000   (pill / teal / Fraunces)
- http://demo-bistro.localhost:3000   (soft / wine+gold / Playfair)

Three sites, identical code, look like different agencies built them.
**That's the spine working.**

## How a publish works (ISR, no redeploy)

1. Console edits the `draft` config row.
2. On publish: copy draft -> `published` row, append to `config_versions`,
   `revalidateTag('host:<hostname>')`.
3. The edge cache for exactly that one site refreshes. No deploy, no
   effect on any other tenant. Rollback = re-publish an older
   `config_versions` snapshot.

## How a new client goes live (Week 4 flow, schema ready now)

1. Insert `tenants` row (niche+city unique -> exclusivity enforced).
2. Insert `domains` row; call Cloudflare for SaaS to add the custom
   hostname; client points a CNAME at `sites.youragency.com`.
3. Create draft + published `site_configs` from a theme starter.
4. VA fills content, picks variants/tokens, previews, publishes.

Target: under a day, content-and-config only - no engineering.

## Next build steps

- **Week 2:** flesh out all 12 block types to 3 variants each; wire
  next/font for the pairing catalog; Lighthouse CI gate >=95 mobile;
  build the internal theme gallery page.
- **Week 3:** console - Clerk orgs, leads inbox, draft/preview/publish UI,
  change-request queue, Stripe Billing for your retainers.
- **Week 4:** onboarding form + Cloudflare hostname automation; onboard
  the first real client and time it.

## Notes

- RLS is enforced on every tenant table; the console sets
  `app.tenant_id` per request via `setTenantContext()`. The sites app
  reads published config via a dedicated read role (see `rls.sql`).
- The renderer never crashes on bad data: unknown block types and
  feature-flagged-off blocks render nothing.
