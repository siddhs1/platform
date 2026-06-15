import { requirePortal } from "@/lib/portal";
import { listLeads } from "@/lib/queries";
import { leadsToCsv } from "@/lib/portal-settings";

export const dynamic = "force-dynamic";

/**
 * B14 data export: download the signed-in client's leads as CSV. Tenant comes
 * from the session (requirePortal), never the URL, so a client can only ever
 * export their own leads.
 */
export async function GET(): Promise<Response> {
  const ctx = await requirePortal();
  const leads = await listLeads(ctx.tenant.id);
  const csv = leadsToCsv(leads);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads.csv"',
      "Cache-Control": "no-store",
    },
  });
}
