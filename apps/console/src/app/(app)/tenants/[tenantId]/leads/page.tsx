import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getTenant, listLeads, type LeadRow } from "@/lib/queries";
import { relativeTime } from "@/lib/format";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  isLeadStatus,
} from "@/lib/lead-status";
import { setLeadStatus } from "./actions";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  form: "Web form",
  call: "Phone call",
  sms: "SMS",
};

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { tenantId } = await params;
  const rawStatus = (await searchParams).status;
  const statusParam = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) notFound();

  const leads = await listLeads(tenant.id);

  const counts: Record<string, number> = {};
  for (const s of LEAD_STATUSES) counts[s] = 0;
  for (const l of leads) counts[l.status] = (counts[l.status] ?? 0) + 1;

  const activeFilter =
    statusParam && isLeadStatus(statusParam) ? statusParam : null;
  const shown = activeFilter
    ? leads.filter((l) => l.status === activeFilter)
    : leads;

  const base = `/tenants/${tenant.id}/leads`;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Leads</h2>
          <p className="page-sub">
            Inbox and pipeline for {tenant.businessName}.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <Link
          href={base}
          className={`filter-pill${activeFilter === null ? " is-active" : ""}`}
        >
          All <span className="n">{leads.length}</span>
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link
            key={s}
            href={`${base}?status=${s}`}
            className={`filter-pill${activeFilter === s ? " is-active" : ""}`}
          >
            {LEAD_STATUS_LABELS[s]} <span className="n">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card empty">
          <h2>{activeFilter ? "No leads in this stage" : "No leads yet"}</h2>
          <p className="muted">
            {activeFilter
              ? "Try a different filter."
              : "Leads from the site contact form and inbound calls will show up here."}
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="card-head">
            <h2>{activeFilter ? LEAD_STATUS_LABELS[activeFilter] : "All leads"}</h2>
            <span className="muted small">{shown.length} shown</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Source</th>
                <th>Message</th>
                <th>Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((lead: LeadRow) => (
                <tr key={lead.id}>
                  <td>
                    <div className="lead-contact">
                      <span className="nm">{lead.name || "Unknown"}</span>
                      <span className="ct mono">
                        {lead.phone || lead.email || "—"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="source-tag">{sourceLabel(lead.source)}</span>
                  </td>
                  <td>
                    {lead.message ? (
                      <span className="lead-msg">{lead.message}</span>
                    ) : (
                      <span className="lead-msg none">no message</span>
                    )}
                  </td>
                  <td className="muted">{relativeTime(lead.createdAt)}</td>
                  <td>
                    <form action={setLeadStatus} className="status-form">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <input type="hidden" name="leadId" value={lead.id} />
                      <select
                        name="status"
                        defaultValue={lead.status}
                        className="input"
                        aria-label="Lead status"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {LEAD_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="btn">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
