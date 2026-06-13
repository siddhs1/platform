"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { tokensSchema, siteConfigSchema } from "@platform/config";
import { requireSession } from "@/lib/auth";
import {
  getTenant,
  getConfig,
  updateDraftConfig,
  publishConfig,
  getVersionSnapshot,
  getTenantHostnames,
} from "@/lib/queries";

function editorPath(tenantId: string): string {
  return `/tenants/${tenantId}/editor`;
}

/** Bust the live-site ISR cache for each of the tenant's hostnames.
 *  NOTE: the published-site cache lives in the SITES app; revalidateTag
 *  here only affects the console's own cache. True cross-app invalidation
 *  (a shared cache handler or a signed revalidate endpoint on the sites
 *  app) lands in Week 4; until then the live site refreshes on its next
 *  ISR window (<= 1h). Never let a cache error fail the publish. */
async function bustHostCaches(tenantId: string): Promise<void> {
  try {
    const hosts = await getTenantHostnames(tenantId);
    for (const host of hosts) revalidateTag(`host:${host}`);
  } catch {
    /* ignore */
  }
}

export async function saveDraft(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) return;

  const tokensInput = {
    colors: {
      brand: String(formData.get("brand") ?? ""),
      accent: String(formData.get("accent") ?? ""),
      ink: String(formData.get("ink") ?? ""),
      surface: String(formData.get("surface") ?? ""),
      muted: String(formData.get("muted") ?? ""),
    },
    fontPair: String(formData.get("fontPair") ?? ""),
    radius: String(formData.get("radius") ?? ""),
    buttonStyle: String(formData.get("buttonStyle") ?? ""),
    density: String(formData.get("density") ?? ""),
  };
  const customCss = String(formData.get("customCss") ?? "");

  const parsed = tokensSchema.safeParse(tokensInput);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid design tokens";
    redirect(`${editorPath(tenantId)}?err=${encodeURIComponent(msg)}`);
  }
  if (customCss.length > 4000) {
    redirect(
      `${editorPath(tenantId)}?err=${encodeURIComponent("custom CSS exceeds 4000 characters")}`
    );
  }

  await updateDraftConfig(tenant.id, { tokens: parsed.data, customCss });
  redirect(`${editorPath(tenantId)}?saved=1`);
}

export async function publishDraft(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) return;

  const draft = await getConfig(tenant.id, "draft");
  if (!draft) {
    redirect(
      `${editorPath(tenantId)}?err=${encodeURIComponent("no draft to publish")}`
    );
  }

  const parsed = siteConfigSchema.safeParse({
    tokens: draft.tokens,
    pages: draft.pages,
    customCss: draft.customCss,
    featureFlags: draft.featureFlags,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "draft failed validation";
    redirect(`${editorPath(tenantId)}?err=${encodeURIComponent(msg)}`);
  }

  const version = await publishConfig(
    tenant.id,
    parsed.data,
    session.email ?? session.userId
  );
  await bustHostCaches(tenant.id);

  revalidatePath(editorPath(tenantId));
  redirect(`${editorPath(tenantId)}?published=${version}`);
}

export async function rollbackTo(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const version = Number.parseInt(String(formData.get("version") ?? ""), 10);
  if (!tenantId || !Number.isFinite(version)) return;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) return;

  const snapshot = await getVersionSnapshot(tenant.id, version);
  if (snapshot === null) {
    redirect(`${editorPath(tenantId)}?err=${encodeURIComponent("version not found")}`);
  }
  const parsed = siteConfigSchema.safeParse(snapshot);
  if (!parsed.success) {
    redirect(
      `${editorPath(tenantId)}?err=${encodeURIComponent("snapshot failed validation")}`
    );
  }

  const newVersion = await publishConfig(
    tenant.id,
    parsed.data,
    session.email ?? session.userId
  );
  await bustHostCaches(tenant.id);

  revalidatePath(editorPath(tenantId));
  redirect(
    `${editorPath(tenantId)}?rolledback=${version}&published=${newVersion}`
  );
}
