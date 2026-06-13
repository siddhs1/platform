/**
 * Seeds 3 demo tenants so a fake hostname renders a real page from its
 * config row. This is the Week 1 acceptance test and the basis of the
 * internal theme gallery.
 *
 *   pnpm --filter @platform/db seed
 *
 * Resolvable locally at:
 *   demo-roofing.localhost:3000
 *   demo-dental.localhost:3000
 *   demo-bistro.localhost:3000
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  tenants,
  domains,
  siteConfigs,
} from "./schema";
import type { SiteTokens, SitePage } from "./types";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");

const sqlClient = postgres(url, { max: 1 });
const db = drizzle(sqlClient);

// ── Three deliberately different token sets ──────────────────────────
const ROOFING_TOKENS: SiteTokens = {
  colors: {
    brand: "#1F3A5F",
    accent: "#E8A33D",
    ink: "#16202B",
    surface: "#FFFFFF",
    muted: "#5C6B7A",
  },
  fontPair: "archivo-inter",
  radius: "sharp",
  buttonStyle: "solid",
  density: "comfortable",
};

const DENTAL_TOKENS: SiteTokens = {
  colors: {
    brand: "#0E8C8C",
    accent: "#7FD1C4",
    ink: "#1A2E2E",
    surface: "#F7FBFB",
    muted: "#6B8585",
  },
  fontPair: "fraunces-nunito",
  radius: "pill",
  buttonStyle: "soft",
  density: "spacious",
};

const BISTRO_TOKENS: SiteTokens = {
  colors: {
    brand: "#7A2E2E",
    accent: "#D9A441",
    ink: "#2B1A12",
    surface: "#FBF6EE",
    muted: "#8A6F5C",
  },
  fontPair: "playfair-source",
  radius: "soft",
  buttonStyle: "outline",
  density: "comfortable",
};

function homePage(business: string, service: string, city: string): SitePage[] {
  return [
    {
      path: "/",
      title: `${business} — ${service} in ${city}`,
      meta: {
        description: `${business} provides trusted ${service.toLowerCase()} in ${city}. Call for a free quote.`,
        keywords: [`${service} ${city}`, `${service} near me`],
      },
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          variant: "image-right",
          props: {
            heading: `${service} in ${city} you can rely on`,
            sub: `Licensed, insured, and trusted by your neighbors.`,
            ctaLabel: "Get a free quote",
          },
        },
        {
          id: "services-1",
          type: "services",
          variant: "cards",
          props: { heading: "What we do" },
        },
        {
          id: "testimonials-1",
          type: "testimonials",
          variant: "carousel",
          props: { heading: "What customers say" },
        },
        {
          id: "cta-1",
          type: "cta-band",
          variant: "default",
          props: { heading: "Ready to start?", ctaLabel: "Call now" },
        },
        {
          id: "contact-1",
          type: "contact-form",
          variant: "split",
          props: { heading: "Request a quote" },
        },
        {
          id: "footer-1",
          type: "footer",
          variant: "default",
          props: {},
        },
      ],
    },
  ];
}

async function main() {
  console.log("Seeding demo tenants…");

  const demos = [
    {
      slug: "demo-roofing",
      businessName: "Summit Roofing Co.",
      niche: "Roofers",
      city: "Tampa",
      state: "FL",
      tokens: ROOFING_TOKENS,
      pages: homePage("Summit Roofing Co.", "Roofing", "Tampa"),
    },
    {
      slug: "demo-dental",
      businessName: "Bright Smile Dental",
      niche: "Dentists",
      city: "Raleigh",
      state: "NC",
      tokens: DENTAL_TOKENS,
      pages: homePage("Bright Smile Dental", "Dental Care", "Raleigh"),
    },
    {
      slug: "demo-bistro",
      businessName: "Olive & Ember",
      niche: "Restaurants",
      city: "Austin",
      state: "TX",
      tokens: BISTRO_TOKENS,
      pages: homePage("Olive & Ember", "Dining", "Austin"),
    },
  ];

  for (const d of demos) {
    const [tenant] = await db
      .insert(tenants)
      .values({
        slug: d.slug,
        businessName: d.businessName,
        niche: d.niche,
        city: d.city,
        state: d.state,
        status: "live",
        plan: "growth",
      })
      .returning();

    if (!tenant) throw new Error(`failed to insert tenant ${d.slug}`);

    await db.insert(domains).values({
      tenantId: tenant.id,
      hostname: `${d.slug}.localhost:3000`,
      isPrimary: true,
      sslStatus: "active",
    });

    // draft + published configs (identical at seed time)
    for (const state of ["draft", "published"] as const) {
      await db.insert(siteConfigs).values({
        tenantId: tenant.id,
        state,
        tokens: d.tokens,
        pages: d.pages,
        customCss: "",
        featureFlags: {},
        version: 1,
        publishedAt: state === "published" ? new Date() : null,
      });
    }

    console.log(`  ✓ ${d.businessName} → ${d.slug}.localhost:3000`);
  }

  console.log("Done. Start the sites app and visit any host above.");
  await sqlClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
