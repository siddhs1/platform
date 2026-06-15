import "server-only";
import { db, schema } from "@platform/db";
import { eq } from "drizzle-orm";
import type { LeadRow } from "./queries";

/**
 * Settings data for the client portal (B13 notifications + B14 data export).
 * Scoped to the caller's tenant id.
 */

export interface NotifyPrefs {
  notifyEmail: string | null;
  notifyPhone: string | null;
  notifyEmailEnabled: boolean;
  notifySmsEnabled: boolean;
}

/** Persist the tenant's new-lead notification recipients + per-channel toggles. */
export async function updateNotifyPrefs(
  tenantId: string,
  p: NotifyPrefs
): Promise<void> {
  await db
    .update(schema.tenants)
    .set({
      notifyEmail: p.notifyEmail,
      notifyPhone: p.notifyPhone,
      notifyEmailEnabled: p.notifyEmailEnabled,
      notifySmsEnabled: p.notifySmsEnabled,
      updatedAt: new Date(),
    })
    .where(eq(schema.tenants.id, tenantId));
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Render tenant leads as CSV (B14 data export). Pure. */
export function leadsToCsv(rows: LeadRow[]): string {
  const header = [
    "Created",
    "Source",
    "Name",
    "Phone",
    "Email",
    "Status",
    "Value",
    "Message",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.createdAt ? new Date(r.createdAt).toISOString() : "",
        r.source,
        r.name ?? "",
        r.phone ?? "",
        r.email ?? "",
        r.status,
        r.valueEstimate ?? "",
        r.message ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }
  return lines.join("\r\n") + "\r\n";
}
