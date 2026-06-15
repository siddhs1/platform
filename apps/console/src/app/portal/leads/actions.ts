"use server";

import { revalidatePath } from "next/cache";
import { requirePortal } from "@/lib/portal";
import {
  getPortalLead,
  setLeadStatusLogged,
  addLeadNote,
  setLeadValueLogged,
} from "@/lib/portal-leads";
import { isLeadStatus } from "@/lib/lead-status";

/**
 * Lead mutations for the client portal (B2 + B3). Each resolves the tenant
 * from the session via requirePortal() -- never from the form/URL -- and the
 * underlying queries match on (lead id AND tenant id), so a forged lead id
 * from another tenant touches nothing. Invoked from <form action={...}>, so
 * they work without client JS.
 */

function actorOf(ctx: { name: string | null; email: string | null }): string {
  return ctx.name || ctx.email || "Client";
}

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export async function updatePortalLeadStatus(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!leadId || !isLeadStatus(status)) return;

  const ctx = await requirePortal();
  const lead = await getPortalLead(ctx.tenant.id, leadId);
  if (!lead) return;

  await setLeadStatusLogged(
    ctx.tenant.id,
    leadId,
    lead.status,
    status,
    actorOf(ctx)
  );
  revalidatePath(`/portal/leads/${leadId}`);
  revalidatePath("/portal/leads");
  revalidatePath("/portal");
}

export async function addPortalNote(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("note") ?? "").trim();
  if (!leadId || !body) return;

  const ctx = await requirePortal();
  const lead = await getPortalLead(ctx.tenant.id, leadId);
  if (!lead) return;

  await addLeadNote(ctx.tenant.id, leadId, body.slice(0, 2000), actorOf(ctx));
  revalidatePath(`/portal/leads/${leadId}`);
}

export async function updatePortalLeadValue(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "");
  const raw = String(formData.get("value") ?? "").replace(/[^0-9.]/g, "");
  if (!leadId) return;

  const ctx = await requirePortal();
  const lead = await getPortalLead(ctx.tenant.id, leadId);
  if (!lead) return;

  const num = raw === "" ? NaN : Number(raw);
  const value = Number.isFinite(num) && num > 0 ? num.toFixed(2) : null;
  const display = value ? money(Number(value)) : "";

  await setLeadValueLogged(ctx.tenant.id, leadId, value, display, actorOf(ctx));
  revalidatePath(`/portal/leads/${leadId}`);
}
