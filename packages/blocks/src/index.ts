/**
 * Importing this package registers every block as a side effect, then
 * re-exports the renderer surface used by both apps.
 */
import "./blocks/hero";
import "./blocks/core-blocks";

export {
  renderBlock,
  registerBlock,
  getBlockDefinition,
  allBlockDefinitions,
  type RenderContext,
  type BlockDefinition,
} from "./registry";
export { tokensToCssVars, FONT_PAIRS } from "./tokens";
export { localBusinessJsonLd, type BusinessContext } from "./schema-ld";