"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePortal } from "@/lib/portal";
import { updateNotifyPrefs } from "@/lib/portal-settings";
import { createInvite, type ClientRole } from "@/lib/portal-team";
import { notifyNewLead } from "@platform/notify";

/**
 * Settings mutations for the client portal (B13 + B14). Tenant comes from
 * the session (requirePortal), never the form. Form-based, so they work
 * without client JS.
 */

export async function saveNotifications(formData: FormData): Promise<void> {
  const ctx = await requirePortal();
  const email = String(formData.get("notifyEmail") ?? "").trim() || null;
  const phone = String(formData.get("notifyPhone") ?? "").trim() || null;

  await updateNotifyPrefs(ctx.tenant.id, {
    notifyEmail: email,
    notifyPhone: phone,
    notifyEmailEnabled: formData.get("emailEnabled") === "on",
    notifySmsEnabled: formData.get("smsEnabled") === "on",
  });
  revalidatePath("/portal/settings");
  redirect("/portal/settings?saved=1");
}

export async function sendTestNotification(): Promise<void> {
  const ctx = await requirePortal();
  const t = ctx.tenant;
  // Best-effort: channels without provider keys (Resend/Twilio) return a
  // skipped outcome; never throws.
  await notifyNewLead({
    business: t.businessName,
    lead: {
      source: "form",
      name: "Test Lead",
      phone: t.notifyPhone,
      email: t.notifyEmail,
      message: "This is a test notification from your console.",
    },
    recipients: {
      email: t.notifyEmail,
      phone: t.notifyPhone,
      emailEnabled: t.notifyEmailEnabled,
      smsEnabled: t.notifySmsEnabled,
    },
  }).catch(() => []);
  redirect("/portal/settings?tested=1");
}

const ROLES = ["client_admin", "client_staff"] as const;

export async function inviteTeammate(formData: FormData): Promise<void> {
  const ctx = await requirePortal();
  const email = String(formData.get("email") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "");
  const role: ClientRole = (ROLES as readonly string[]).includes(roleRaw)
    ? (roleRaw as ClientRole)
    : "client_staff";

  if (!email || !email.includes("@")) {
    redirect(`/portal/settings?err=${encodeURIComponent("Enter a valid email")}`);
  }

  await createInvite(ctx.tenant, email, role);
  revalidatePath("/portal/settings");
  redirect("/portal/settings?invited=1");
}
