/**
 * The block registry. Single source of truth for both apps: the sites
 * renderer maps published config through it; the console preview renders
 * the same components against draft config.
 *
 * A registry entry declares the block's allowed variants and its render
 * function. A block whose type isn't registered, or whose L4 feature
 * flag is off, renders nothing - a bad config never 500s a client site.
 */
import type { ReactNode } from "react";
import type {
  SiteBlock,
  SiteTokens,
  FeatureFlags,
  BlockType,
} from "@platform/db";
import type { BusinessContext } from "./schema-ld";

export interface RenderContext {
  tokens: SiteTokens;
  featureFlags: FeatureFlags;
  business: BusinessContext;
}

export interface BlockDefinition {
  type: BlockType;
  variants: string[];
  // L4 gate: if set, the block only renders when this flag is enabled.
  requiresFlag?: string;
  render: (block: SiteBlock, ctx: RenderContext) => ReactNode;
}

const registry = new Map<BlockType, BlockDefinition>();

export function registerBlock(def: BlockDefinition) {
  registry.set(def.type, def);
}

export function getBlockDefinition(
  type: BlockType
): BlockDefinition | undefined {
  return registry.get(type);
}

export function allBlockDefinitions(): BlockDefinition[] {
  return [...registry.values()];
}

/**
 * Safe dispatch. Returns null for unknown types or gated-off blocks.
 * In the app, wrap the null path with a Sentry warning at the call site
 * if desired; here we stay pure.
 */
export function renderBlock(
  block: SiteBlock,
  ctx: RenderContext
): ReactNode {
  const def = registry.get(block.type);
  if (!def) return null;
  if (def.requiresFlag && !ctx.featureFlags[def.requiresFlag]) return null;
  return def.render(block, ctx);
}
