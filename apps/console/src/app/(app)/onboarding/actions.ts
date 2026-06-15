"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { isOperator } from "@/lib/clerk";
import { PRESETS_BY_ID } from "@platform/db";
import {
  checkExclusivity,
  slugTaken,
  createTenant,
  provisionClerkOrg,
  slugify,
  PLAN_OPTIONS,
  type PlanTier,
} from "@/lib/onboarding";
import { createDomainRow } from "@/lib/domains";
import { createCustomHostname } from "@/lib/cloudflare";

/**
 * C1 onboarding: create a client tenant from the intake form. Operator-only.
 * redirect() throws NEXT_REDIRECT, so `err` returns `never` and composes in a
 * .catch without widening the awaited type.
 */
function err(msg: string): never {
  redirect(`/onboarding?err=${encodeURIComponent(msg)}`);
}

export async function onboardClient(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!isOperator(session.role)) err("Operators only");

  const businessName = String(formData.get("businessName") ?? "").trim();
  const niche = String(formData.get("niche") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase();
  const planRaw = String(formData.get("plan") ?? "");
  const presetId = String(formData.get("preset") ?? "");
  const clientEmail = String(formData.get("clientEmail") ?? "").trim() || null;
  const hostname = String(formData.get("hostname") ?? "").trim().toLowerCase();
  const slug = slugify(String(formData.get("slug") ?? "").trim() || businessName);

  if (!businessName || !niche || !city || !state) {
    err("Fill in business name, niche, city, and state");
  }
  if (!slug) err("Could not derive a slug from the business name");
  const plan: PlanTier = (PLAN_OPTIONS as readonly string[]).includes(planRaw)
    ? (planRaw as PlanTier)
    : "growth";
  if (!PRESETS_BY_ID[presetId]) err("Choose a theme");

  const conflict = await checkExclusivity(niche, city, state);
  if (conflict) {
    err(`${conflict.businessName} already holds ${niche} in ${city}, ${state}`);
  }
  if (await slugTaken(slug)) err(`The slug "${slug}" is already taken`);

  const tenantId = await createTenant({
    businessName,
    slug,
    niche,
    city,
    state,
    plan,
    presetId,
  }).catch((): never =>
    err("Could not create the client (it may conflict with an existing one)")
  );

  // Primary domain. localhost dev hosts resolve immediately; real custom
  // hostnames go through Cloudflare for SaaS (degrades to pending without keys).
  const host = hostname || `${slug}.localhost:3000`;
  const isLocal = host.includes("localhost");
  const cf = isLocal
    ? { id: null, ssl: "active" as const }
    : await createCustomHostname(host);
  await createDomainRow({
    tenantId,
    hostname: host,
    cfHostnameId: cf.id,
    sslStatus: isLocal ? "active" : cf.ssl,
    isPrimary: true,
  }).catch(() => {
    /* hostname collision is non-fatal; operator can fix on the domains tab */
  });

  // Best-effort Clerk org + client invite.
  await provisionClerkOrg(tenantId, businessName, session.userId, clientEmail);

  redirect(`/tenants/${tenantId}?onboarded=1`);
}
