/**
 * Validation for config payloads. The console runs these before saving a
 * draft and before publishing; the seed runs them implicitly via types.
 * A config that fails here is rejected at the boundary, so the renderer
 * only ever sees well-formed data.
 */
import { z } from "zod";

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be a hex color");

export const tokensSchema = z.object({
  colors: z.object({
    brand: hex,
    accent: hex,
    ink: hex,
    surface: hex,
    muted: hex,
  }),
  fontPair: z.string().min(1),
  radius: z.enum(["sharp", "soft", "pill"]),
  buttonStyle: z.enum(["solid", "outline", "soft"]),
  density: z.enum(["compact", "comfortable", "spacious"]),
});

// Allowed variants per block type. Kept in lockstep with the registry in
// @platform/blocks (each registerBlock() declares the same list). This
// package intentionally does NOT import @platform/blocks — config stays a
// pure, dependency-light validation layer — so the contract is duplicated
// here on purpose. If you add a variant in the registry, add it here too.
// (A Week 2+ test asserts these two lists match; see blocks/registry.)
export const BLOCK_VARIANTS = {
  hero: ["image-right", "full-bleed", "video-bg"],
  services: ["cards", "list", "icon-grid"],
  testimonials: ["carousel", "wall", "single-quote"],
  "service-area": ["map-pins", "city-list", "radius"],
  "before-after": ["slider", "side-by-side", "toggle"],
  team: ["grid", "rows", "spotlight"],
  faq: ["accordion", "two-column", "list"],
  "cta-band": ["default"],
  "contact-form": ["split", "stacked"],
  "reviews-feed": ["stars-summary", "cards", "badges"],
  gallery: ["masonry", "grid", "filmstrip"],
  footer: ["default"],
  "trust-bar": ["stats"],
  "why-us": ["icon-grid"],
  story: ["prose"],
  stats: ["cards"],
  credentials: ["badges"],
  guarantee: ["banner"],
  "lead-hero": ["split"],
  process: ["steps"],
  included: ["checklist"],
  "blog-index": ["grid"],
  "blog-post": ["default"],
  contact: ["split"],
  financing: ["cards"],
  legal: ["prose"],
} as const satisfies Record<string, readonly [string, ...string[]]>;

export type BlockTypeName = keyof typeof BLOCK_VARIANTS;

const blockTypeEnum = z.enum(
  Object.keys(BLOCK_VARIANTS) as [BlockTypeName, ...BlockTypeName[]]
);

// A block is valid when its variant is one of the variants registered for
// its type. superRefine lets the error point at the variant field with a
// message naming the allowed set — useful feedback in the console editor.
export const blockSchema = z
  .object({
    id: z.string().min(1),
    type: blockTypeEnum,
    variant: z.string().min(1),
    props: z.record(z.string(), z.unknown()),
  })
  .superRefine((block, ctx) => {
    const allowed = BLOCK_VARIANTS[block.type] as readonly string[];
    if (!allowed.includes(block.variant)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variant"],
        message: `invalid variant "${block.variant}" for ${block.type}; expected one of: ${allowed.join(", ")}`,
      });
    }
  });

export const pageSchema = z.object({
  path: z.string().startsWith("/"),
  title: z.string().min(1),
  meta: z.object({
    description: z.string(),
    keywords: z.array(z.string()).optional(),
  }),
  blocks: z.array(blockSchema),
});

// L3 cap: roughly one screenful, enforced here.
const CUSTOM_CSS_MAX = 4000;

export const siteConfigSchema = z.object({
  tokens: tokensSchema,
  pages: z.array(pageSchema).min(1),
  customCss: z.string().max(CUSTOM_CSS_MAX, "custom CSS exceeds cap"),
  featureFlags: z.record(z.string(), z.boolean()),
});

export type ValidatedSiteConfig = z.infer<typeof siteConfigSchema>;
