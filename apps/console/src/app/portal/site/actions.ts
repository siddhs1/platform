"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { siteConfigSchema } from "@platform/config";
import { presetTokens, PRESETS_BY_ID } from "@platform/db";
import type { BusinessProfile, SocialLink } from "@platform/db";
import { requirePortal } from "@/lib/portal";
import {
  getConfig,
  updateDraftConfig,
  publishConfig,
  getTenantHostnames,
} from "@/lib/queries";
import { updateBusinessProfile } from "@/lib/portal-site";

/**
 * Site-appearance mutations for the client portal (B12). Tenant comes from
 * the session (requirePortal), never the form. Business details save to the
 * tenant row (live, picked up on the next ISR window); a theme choice updates
 * the draft tokens and publishes via the existing Step 2 flow.
 */

function errorRedirect(msg: string): never {
  redirect(`/portal/site?err=${encodeURIComponent(msg)}`);
}

async function bustHostCaches(tenantId: string): Promise<void> {
  try {
    const hosts = await getTenantHostnames(tenantId);
    for (const host of hosts) revalidateTag(`host:${host}`);
  } catch {
    /* never fail the save on a cache error */
  }
}

const SOCIAL_PLATFORMS = ["facebook", "instagram", "x", "youtube"] as const;

export async function saveBusinessDetails(formData: FormData): Promise<void> {
  const ctx = await requirePortal();
  const existing: BusinessProfile = ctx.tenant.businessProfile ?? {};

  const str = (k: string): string | undefined => {
    const v = String(formData.get(k) ?? "").trim();
    return v ? v : undefined;
  };

  const socials: SocialLink[] = [];
  for (const platform of SOCIAL_PLATFORMS) {
    const href = String(formData.get(`social_${platform}`) ?? "").trim();
    if (href) socials.push({ platform, href });
  }

  const profile: BusinessProfile = {
    ...existing,
    tagline: str("tagline"),
    phone: str("phone"),
    email: str("email"),
    licenseNumber: str("licenseNumber"),
    insured: formData.get("insured") === "on",
    socials: socials.length > 0 ? socials : undefined,
  };

  await updateBusinessProfile(ctx.tenant.id, profile);
  await bustHostCaches(ctx.tenant.id);
  revalidatePath("/portal/site");
  redirect("/portal/site?saved=1");
}

export async function applyTheme(formData: FormData): Promise<void> {
  const presetId = String(formData.get("preset") ?? "");
  const ctx = await requirePortal();

  if (!PRESETS_BY_ID[presetId]) {
    errorRedirect("Choose a theme");
  }

  const draft = await getConfig(ctx.tenant.id, "draft");
  if (!draft) {
    errorRedirect("Your site is not set up yet");
  }

  const tokens = presetTokens(presetId);
  const parsed = siteConfigSchema.safeParse({
    tokens,
    pages: draft.pages,
    customCss: draft.customCss,
    featureFlags: draft.featureFlags,
  });
  if (!parsed.success) {
    errorRedirect("That theme could not be applied");
  }

  await updateDraftConfig(ctx.tenant.id, {
    tokens: parsed.data.tokens,
    customCss: draft.customCss,
  });
  const version = await publishConfig(
    ctx.tenant.id,
    parsed.data,
    ctx.email ?? ctx.userId
  );
  await bustHostCaches(ctx.tenant.id);
  revalidatePath("/portal/site");
  revalidatePath("/portal");
  redirect(`/portal/site?published=${version}`);
}
