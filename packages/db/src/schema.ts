/**
 * Multi-tenant schema — the spine of the whole platform.
 *
 * Design rules (locked decisions):
 *   - One database, every row carries tenant_id, RLS enforces isolation.
 *   - Customization lives in DATA, not code:
 *       L1 design tokens  → site_configs.tokens
 *       L2 page/blocks    → site_configs.pages
 *       L3 scoped CSS     → site_configs.custom_css (capped)
 *       L4 custom blocks  → site_configs.feature_flags (gates registry blocks)
 *   - draft vs published: two rows per tenant differentiated by `state`,
 *     plus an append-only history of published versions for one-click rollback.
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type {
  SiteTokens,
  SitePage,
  FeatureFlags,
  ConfigDiff,
  ServiceArea,
} from "./types";

// ── Enums ────────────────────────────────────────────────────────────
export const tenantStatus = pgEnum("tenant_status", [
  "prospect",
  "onboarding",
  "live",
  "paused",
  "churned",
]);

export const planTier = pgEnum("plan_tier", ["basic", "growth", "scale"]);

export const configState = pgEnum("config_state", ["draft", "published"]);

export const sslStatus = pgEnum("ssl_status", [
  "pending",
  "active",
  "failed",
]);

export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
]);

export const changeStatus = pgEnum("change_status", [
  "queued",
  "in_progress",
  "preview_ready",
  "approved",
  "published",
]);

export const subscriptionStatus = pgEnum("subscription_status", [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
]);

// ── Tenants ──────────────────────────────────────────────────────────
// A client is a row. niche+city is unique → enforces "one client per
// niche per city" at the database level, making the exclusivity promise
// structurally honest.
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    businessName: text("business_name").notNull(),
    niche: text("niche").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    status: tenantStatus("status").notNull().default("onboarding"),
    plan: planTier("plan").notNull().default("growth"),
    stripeCustomerId: text("stripe_customer_id"),
    // Clerk organization id — links a tenant to its console logins.
    clerkOrgId: text("clerk_org_id"),
    // Cities this tenant serves, used to generate /<service>/<city> and
    // /areas/<city> pages from data. Defaults to an empty array.
    serviceAreas: jsonb("service_areas")
      .$type<ServiceArea[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("tenants_slug_idx").on(t.slug),
    nicheCityIdx: uniqueIndex("tenants_niche_city_idx").on(
      t.niche,
      t.city,
      t.state
    ),
  })
);

// ── Domains ──────────────────────────────────────────────────────────
// Hostname → tenant resolution lives here. The sites-app middleware
// looks up the incoming host in this table.
export const domains = pgTable(
  "domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    // Cloudflare for SaaS custom-hostname id, populated at onboarding.
    cfHostnameId: text("cf_hostname_id"),
    sslStatus: sslStatus("ssl_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    hostnameIdx: uniqueIndex("domains_hostname_idx").on(t.hostname),
    tenantIdx: index("domains_tenant_idx").on(t.tenantId),
  })
);

// ── Site configs ─────────────────────────────────────────────────────
// The customization payload. One draft + one published row per tenant
// for the live editing surface; published rows are also copied into
// config_versions on each publish for rollback.
export const siteConfigs = pgTable(
  "site_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    state: configState("state").notNull(),
    // L1 — design tokens (typed; see types.ts)
    tokens: jsonb("tokens").$type<SiteTokens>().notNull(),
    // L2 — pages as ordered arrays of typed blocks
    pages: jsonb("pages").$type<SitePage[]>().notNull(),
    // L3 — scoped per-tenant CSS, size-capped in app validation
    customCss: text("custom_css").notNull().default(""),
    // L4 — feature flags gating custom blocks in the shared registry
    featureFlags: jsonb("feature_flags")
      .$type<FeatureFlags>()
      .notNull()
      .default({}),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: text("published_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // exactly one row per (tenant, state)
    tenantStateIdx: uniqueIndex("site_configs_tenant_state_idx").on(
      t.tenantId,
      t.state
    ),
  })
);

// Append-only history of every published config → one-click rollback.
export const configVersions = pgTable(
  "config_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").notNull(), // full published config payload
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedBy: text("published_by"),
  },
  (t) => ({
    tenantVersionIdx: uniqueIndex("config_versions_tenant_version_idx").on(
      t.tenantId,
      t.version
    ),
  })
);

// ── Leads ────────────────────────────────────────────────────────────
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // form | call | sms
    name: text("name"),
    phone: text("phone"),
    email: text("email"),
    message: text("message"),
    status: leadStatus("status").notNull().default("new"),
    valueEstimate: numeric("value_estimate", { precision: 10, scale: 2 }),
    twilioCallSid: text("twilio_call_sid"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tenantStatusIdx: index("leads_tenant_status_idx").on(
      t.tenantId,
      t.status
    ),
  })
);

// ── Change requests ──────────────────────────────────────────────────
// Paper trail: every change goes queued → ... → published. VA-operable.
export const changeRequests = pgTable(
  "change_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    requestedBy: text("requested_by").notNull(),
    description: text("description").notNull(),
    status: changeStatus("status").notNull().default("queued"),
    configDiff: jsonb("config_diff").$type<ConfigDiff>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tenantIdx: index("change_requests_tenant_idx").on(t.tenantId),
  })
);

// ── Relations ────────────────────────────────────────────────────────
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    status: subscriptionStatus("status").notNull(),
    plan: planTier("plan").notNull(),
    priceId: text("price_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    stripeSubIdx: uniqueIndex("subscriptions_stripe_sub_id_idx").on(
      t.stripeSubscriptionId
    ),
    tenantIdx: index("subscriptions_tenant_idx").on(t.tenantId),
  })
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
  domains: many(domains),
  siteConfigs: many(siteConfigs),
  leads: many(leads),
  changeRequests: many(changeRequests),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [subscriptions.tenantId],
    references: [tenants.id],
  }),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
  tenant: one(tenants, {
    fields: [domains.tenantId],
    references: [tenants.id],
  }),
}));

export const siteConfigsRelations = relations(siteConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [siteConfigs.tenantId],
    references: [tenants.id],
  }),
}));

// ── Row-Level Security note ──────────────────────────────────────────
// RLS policies are applied via a SQL migration (see drizzle/ + the
// rls.sql shipped in this package). Drizzle-kit doesn't emit RLS, so the
// policy file is applied after the generated migration. Each policy keys
// off current_setting('app.tenant_id') which the app sets per request.
export const enableRlsStatement = sql`-- see rls.sql`;
