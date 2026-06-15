"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePortal } from "@/lib/portal";
import {
  getPortalRequest,
  createPortalRequest,
  setRequestStatus,
  REQUEST_KINDS,
  REQUEST_PAGES,
} from "@/lib/portal-requests";

/**
 * Change-request mutations for the client portal (B5). Each resolves the
 * tenant from the session via requirePortal() -- never from the form/URL --
 * and the underlying queries match on (id AND tenant id). Form-based, so they
 * work without client JS.
 */

function actorOf(ctx: { name: string | null; email: string | null }): string {
  return ctx.name || ctx.email || "Client";
}

export async function createRequest(formData: FormData): Promise<void> {
  const kind = String(formData.get("kind") ?? "");
  const pageRaw = String(formData.get("page") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  const ctx = await requirePortal();

  const validKind = (REQUEST_KINDS as readonly string[]).includes(kind)
    ? kind
    : null;
  const page = (REQUEST_PAGES as readonly string[]).includes(pageRaw)
    ? pageRaw
    : null;
  if (!validKind || !body) {
    redirect("/portal/requests/new?error=1");
  }

  await createPortalRequest({
    tenantId: ctx.tenant.id,
    kind: validKind,
    page,
    body: body.slice(0, 4000),
    requestedBy: actorOf(ctx),
  });
  revalidatePath("/portal/requests");
  redirect("/portal/requests?created=1");
}

export async function approveRequest(formData: FormData): Promise<void> {
  const id = String(formData.get("requestId") ?? "");
  if (!id) return;
  const ctx = await requirePortal();
  const req = await getPortalRequest(ctx.tenant.id, id);
  if (!req || req.status !== "preview_ready") return;

  await setRequestStatus(ctx.tenant.id, id, "approved");
  revalidatePath(`/portal/requests/${id}`);
  revalidatePath("/portal/requests");
}

export async function requestChanges(formData: FormData): Promise<void> {
  const id = String(formData.get("requestId") ?? "");
  if (!id) return;
  const ctx = await requirePortal();
  const req = await getPortalRequest(ctx.tenant.id, id);
  if (!req || req.status !== "preview_ready") return;

  await setRequestStatus(ctx.tenant.id, id, "in_progress");
  revalidatePath(`/portal/requests/${id}`);
  revalidatePath("/portal/requests");
}
