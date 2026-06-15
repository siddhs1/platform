import "server-only";
import { db, schema, THEME_PRESETS } from "@platform/db";
import type { BusinessProfile, SiteTokens } from "@platform/db";
import { eq } from "drizzle-orm";

/**
 * Site-appearance helpers for the CLIENT PORTAL (B12). Safe-field only:
 * business profile (tenants.business_profile) + theme preset (L1 tokens).
 * The portal never edits raw token JSON or custom CSS; theme changes are
 * limited to the curated presets. Scoped to the caller's tenant id.
 */

/** Persist the editable business profile. Other JSONB on the tenant row is
 *  untouched; the caller merges any preserved fields before passing it in. */
export async function updateBusinessProfile(
  tenantId: string,
  profile: BusinessProfile
): Promise<void> {
  await db
    .update(schema.tenants)
    .set({ businessProfile: profile, updatedAt: new Date() })
    .where(eq(schema.tenants.id, tenantId));
}

/** Which curated preset (if any) the given tokens currently match, so the
 *  editor can show the active choice. Compares the known token fields rather
 *  than JSON.stringify (jsonb key order is not guaranteed). */
export function matchPresetId(tokens: SiteTokens): string | null {
  for (const p of THEME_PRESETS) {
    const t = p.tokens;
    if (
      t.colors.brand === tokens.colors.brand &&
      t.colors.accent === tokens.colors.accent &&
      t.colors.ink === tokens.colors.ink &&
      t.colors.surface === tokens.colors.surface &&
      t.colors.muted === tokens.colors.muted &&
      t.fontPair === tokens.fontPair &&
      t.radius === tokens.radius &&
      t.buttonStyle === tokens.buttonStyle &&
      t.density === tokens.density
    ) {
      return p.id;
    }
  }
  return null;
}
