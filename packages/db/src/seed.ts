/**
 * Seeds 3 demo tenants so a fake hostname renders a real page from its
 * config row. This is the Week 1 acceptance test and the basis of the
 * internal theme gallery + the per-service/per-city page generation.
 *
 *   pnpm --filter @platform/db seed
 *
 * Idempotent: re-running upserts the demo tenants/domains/configs in
 * place (keyed on the unique slug / hostname / (tenant,state) indexes),
 * so it is safe to re-run after schema or content changes.
 *
 * Resolvable locally at:
 *   demo-roofing.localhost:3000
 *   demo-dental.localhost:3000
 *   demo-bistro.localhost:3000
 * Generated pages, e.g.:
 *   demo-roofing.localhost:3000/areas/clearwater
 *   demo-roofing.localhost:3000/roofer-repair/st-petersburg
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tenants, domains, siteConfigs } from "./schema";
import type { SitePage, ServiceArea, BusinessProfile } from "./types";
import { trustBlueTokens, slateTradesTokens, tealCareTokens, wineHospitalityTokens } from "./presets";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set");

const sqlClient = postgres(url, { max: 1 });
const db = drizzle(sqlClient);

// Local slug helper (mirrors slugify in @platform/blocks; duplicated so
// the db package stays dependency-light and doesn't import blocks).
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// -- Three deliberately different token sets ---------------------------
const ROOFING_TOKENS = trustBlueTokens;

const DENTAL_TOKENS = tealCareTokens;

const BISTRO_TOKENS = wineHospitalityTokens;

// -- Business profiles (contact / NAP / hours / licensing) -------------
// Rendered by the site chrome (header phone + CTA, footer sitemap) and
// used to enrich LocalBusiness JSON-LD. Fake numbers (555 exchange) and
// reserved .example emails on purpose.
const ROOFING_PROFILE = {
  tagline: "Tampa Bay's trusted roofing contractor since 1998.",
  phone: "(813) 555-0142",
  email: "hello@summitroofing.example",
  address: {
    line1: "4210 W Gandy Blvd",
    city: "Tampa",
    state: "FL",
    postalCode: "33611",
  },
  hours: [
    { label: "Mon-Fri", value: "8 AM - 6 PM" },
    { label: "Sat", value: "9 AM - 2 PM" },
    { label: "Sun", value: "Closed" },
  ],
  licenseNumber: "CCC1330812",
  insured: true,
  socials: [
    { platform: "facebook", href: "https://facebook.com/summitroofing" },
    { platform: "instagram", href: "https://instagram.com/summitroofing" },
  ],
} satisfies BusinessProfile;

const DENTAL_PROFILE = {
  tagline: "Gentle, modern dentistry for the whole family.",
  phone: "(919) 555-0188",
  email: "smile@brightsmile.example",
  address: {
    line1: "1820 Glenwood Ave",
    line2: "Suite 210",
    city: "Raleigh",
    state: "NC",
    postalCode: "27608",
  },
  hours: [
    { label: "Mon-Thu", value: "8 AM - 5 PM" },
    { label: "Fri", value: "8 AM - 1 PM" },
    { label: "Sat-Sun", value: "Closed" },
  ],
  licenseNumber: "NC-DEN-44915",
  insured: true,
  socials: [
    { platform: "facebook", href: "https://facebook.com/brightsmiledental" },
    { platform: "instagram", href: "https://instagram.com/brightsmiledental" },
  ],
} satisfies BusinessProfile;

const BISTRO_PROFILE = {
  tagline: "Wood-fired Mediterranean plates in the heart of Austin.",
  phone: "(512) 555-0177",
  email: "reserve@oliveandember.example",
  address: {
    line1: "612 E 6th St",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
  },
  hours: [
    { label: "Tue-Thu", value: "5 PM - 10 PM" },
    { label: "Fri-Sat", value: "5 PM - 11 PM" },
    { label: "Sun-Mon", value: "Closed" },
  ],
  socials: [
    { platform: "instagram", href: "https://instagram.com/oliveandember" },
    { platform: "facebook", href: "https://facebook.com/oliveandember" },
  ],
} satisfies BusinessProfile;

function homePage(
  business: string,
  service: string,
  city: string,
  state: string,
  areas: ServiceArea[]
): SitePage[] {
  const areaLinks = areas.map((a) => ({
    label: a.city,
    href: `/areas/${slug(a.city)}`,
  }));
  return [
    {
      path: "/",
      title: `${business} - ${service} in ${city}`,
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
          id: "trust-1",
          type: "trust-bar",
          variant: "stats",
          props: {},
        },
        {
          id: "services-1",
          type: "services",
          variant: "cards",
          props: { heading: "What we do" },
        },
        {
          id: "whyus-1",
          type: "why-us",
          variant: "icon-grid",
          props: {},
        },
        {
          id: "beforeafter-1",
          type: "before-after",
          variant: "slider",
          props: {},
        },
        {
          id: "reviews-1",
          type: "reviews-feed",
          variant: "cards",
          props: {},
        },
        {
          id: "area-1",
          type: "service-area",
          variant: "city-list",
          props: { heading: `Areas we serve in ${state}`, areaLinks },
        },
        {
          id: "faq-1",
          type: "faq",
          variant: "accordion",
          props: {},
        },
        {
          id: "cta-1",
          type: "cta-band",
          variant: "default",
          props: { heading: "Ready to start?", ctaLabel: "Call now" },
        },
      ],
    },
  ];
}

async function main() {
  console.log("Seeding demo tenants (idempotent upsert)...");

  const demos = [
    {
      slug: "demo-roofing",
      businessName: "Summit Roofing Co.",
      niche: "Roofers",
      city: "Tampa",
      state: "FL",
      tokens: ROOFING_TOKENS,
      businessProfile: ROOFING_PROFILE,
      serviceAreas: [
        { city: "Tampa", state: "FL" },
        { city: "St. Petersburg", state: "FL" },
        { city: "Clearwater", state: "FL" },
        { city: "Brandon", state: "FL" },
      ] as ServiceArea[],
    },
    {
      slug: "demo-dental",
      businessName: "Bright Smile Dental",
      niche: "Dentists",
      city: "Raleigh",
      state: "NC",
      tokens: DENTAL_TOKENS,
      businessProfile: DENTAL_PROFILE,
      serviceAreas: [
        { city: "Raleigh", state: "NC" },
        { city: "Durham", state: "NC" },
        { city: "Cary", state: "NC" },
        { city: "Chapel Hill", state: "NC" },
      ] as ServiceArea[],
    },
    {
      slug: "demo-bistro",
      businessName: "Olive & Ember",
      niche: "Restaurants",
      city: "Austin",
      state: "TX",
      tokens: BISTRO_TOKENS,
      businessProfile: BISTRO_PROFILE,
      serviceAreas: [
        { city: "Austin", state: "TX" },
        { city: "Round Rock", state: "TX" },
        { city: "Cedar Park", state: "TX" },
      ] as ServiceArea[],
    },
  ];

  const serviceLabel: Record<string, string> = {
    Roofers: "Roofing",
    Dentists: "Dental Care",
    Restaurants: "Dining",
  };

  for (const d of demos) {
    const pages = homePage(
      d.businessName,
      serviceLabel[d.niche] ?? d.niche,
      d.city,
      d.state,
      d.serviceAreas
    );

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
        serviceAreas: d.serviceAreas,
        businessProfile: d.businessProfile,
      })
      .onConflictDoUpdate({
        target: tenants.slug,
        set: {
          businessName: d.businessName,
          niche: d.niche,
          city: d.city,
          state: d.state,
          status: "live",
          plan: "growth",
          serviceAreas: d.serviceAreas,
          businessProfile: d.businessProfile,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!tenant) throw new Error(`failed to upsert tenant ${d.slug}`);

    await db
      .insert(domains)
      .values({
        tenantId: tenant.id,
        hostname: `${d.slug}.localhost:3000`,
        isPrimary: true,
        sslStatus: "active",
      })
      .onConflictDoUpdate({
        target: domains.hostname,
        set: { tenantId: tenant.id, isPrimary: true, sslStatus: "active" },
      });

    // draft + published configs (identical at seed time)
    for (const state of ["draft", "published"] as const) {
      await db
        .insert(siteConfigs)
        .values({
          tenantId: tenant.id,
          state,
          tokens: d.tokens,
          pages,
          customCss: "",
          featureFlags: {},
          version: 1,
          publishedAt: state === "published" ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [siteConfigs.tenantId, siteConfigs.state],
          set: {
            tokens: d.tokens,
            pages,
            customCss: "",
            featureFlags: {},
            version: 1,
            publishedAt: state === "published" ? new Date() : null,
            updatedAt: new Date(),
          },
        });
    }

    console.log(`  ok ${d.businessName} -> ${d.slug}.localhost:3000`);
  }

  console.log("Done. Start the sites app and visit any host above.");
  await sqlClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
