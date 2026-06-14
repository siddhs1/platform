/**
 * Importing this package registers every block as a side effect, then
 * re-exports the renderer surface used by both apps.
 *
 * Import order doesn't matter for correctness (each file self-registers),
 * but we group them: hero first, then the smaller core blocks, then the
 * richer Week 2 blocks.
 */
import "./blocks/hero";
import "./blocks/core-blocks";
import "./blocks/services";
import "./blocks/testimonials";
import "./blocks/service-area";
import "./blocks/before-after";
import "./blocks/team";
import "./blocks/faq";
import "./blocks/reviews-feed";
import "./blocks/gallery";
import "./blocks/home-blocks";
import "./blocks/about-blocks";
import "./blocks/money-blocks";
import "./blocks/blog";
import "./blocks/info-blocks";

export {
  renderBlock,
  registerBlock,
  getBlockDefinition,
  allBlockDefinitions,
  type RenderContext,
  type BlockDefinition,
} from "./registry";
export { tokensToCssVars, FONT_PAIRS } from "./tokens";
export {
  localBusinessJsonLd,
  serviceJsonLd,
  type BusinessContext,
} from "./schema-ld";
export {
  slugify,
  servicesForNiche,
  findServiceBySlug,
  type ServiceDef,
} from "./niche";
