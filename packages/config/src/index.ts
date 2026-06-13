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

export const blockSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "hero",
    "services",
    "testimonials",
    "service-area",
    "before-after",
    "team",
    "faq",
    "cta-band",
    "contact-form",
    "reviews-feed",
    "gallery",
    "footer",
  ]),
  variant: z.string().min(1),
  props: z.record(z.string(), z.unknown()),
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
