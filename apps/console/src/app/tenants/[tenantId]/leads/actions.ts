"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { getTenant, updateLeadStatus } from "@/lib/queries";
import { isLeadStatus } from "@/lib/lead-status";

/**
 * Update a lead's pipeline status. Invoked from a <form action={...}>, so it
 * works without client JS. Authorization is enforced via getTenant() (which
 * applies canAccessTenant); the DB write is additionally scoped to
 * (lead id AND tenant id).
 */
export async function setLeadStatus(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!tenantId || !leadId || !isLeadStatus(status)) return;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) return;

  await updateLeadStatus(tenant.id, leadId, status);
  revalidatePath(`/tenants/${tenantId}/leads`);
}
