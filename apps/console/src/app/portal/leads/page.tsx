import Link from "next/link";
import { requirePortal } from "@/lib/portal";
import { listPortalLeads, type LeadFilters } from "@/lib/portal-leads";
import { relativeTime } from "@/lib/format";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  isLeadStatus,
  type LeadStatus,
} from "@/lib/lead-status";
import type { LeadRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

const SOURCES = ["form", "call", "sms"] as const;
const SOURCE_LABELS: Record<string, string> = {
  form: "Web form",
  call: "Phone call",
  sms: "Text",
};
function sourceLabel(s: string): string {
  return SOURCE_LABELS[s] ?? s;
}

function money(v: string | null): string {
  if (!v) return "\u2014";
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function leadName(lead: LeadRow): string {
  return lead.name || lead.phone || "No name yet";
}

/** Build a /portal/leads href, merging the current filters with overrides. */
function hrefWith(
  current: { status: LeadStatus | null; source: string | null; q: string | null },
  override: { status?: LeadStatus | null; source?: string | null; q?: string | null; page?: number }
): string {
  const status = "status" in override ? override.status : current.status;
  const source = "source" in override ? override.source : current.source;
  const q = "q" in override ? override.q : current.q;
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (source) params.set("source", source);
  if (q) params.set("q", q);
  if (override.page && override.page > 1) params.set("page", String(override.page));
  const qs = params.toString();
  return qs ? `/portal/leads?${qs}` : "/portal/leads";
}

export default async function PortalLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
    source?: string | string[];
    q?: string | string[];
    page?: string | string[];
  }>;
}) {
  const ctx = await requirePortal();
  const sp = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  const statusRaw = first(sp.status);
  const status: LeadStatus | null =
    statusRaw && isLeadStatus(statusRaw) ? statusRaw : null;
  const source = first(sp.source) || null;
  const q = (first(sp.q) || "").trim() || null;
  const page = Math.max(1, parseInt(first(sp.page) || "1", 10) || 1);

  const filters: LeadFilters = { status, source, q, page };
  const res = await listPortalLeads(ctx.tenant.id, filters);
  const current = { status, source, q };

  const allCount = Object.values(res.statusCounts).reduce((a, b) => a + b, 0);
  const tabs: Array<{ key: LeadStatus | null; label: string; n: number }> = [
    { key: null, label: "All", n: allCount },
    ...LEAD_STATUSES.map((s) => ({
      key: s,
      label: LEAD_STATUS_LABELS[s],
      n: res.statusCounts[s] ?? 0,
    })),
  ];

  const hasFilter = Boolean(status || source || q);
  const startIdx = (res.page - 1) * res.perPage;

  return (
    <>
      <div className="p-greet">
        <div>
          <h1>Leads</h1>
          <p>Every call and form submission for {ctx.tenant.businessName}.</p>
        </div>
      </div>

      <div className="p-tabs" role="tablist" aria-label="Lead status">
        {tabs.map((t) => {
          const active = status === t.key;
          return (
            <Link
              key={t.label}
              href={hrefWith(current, { status: t.key })}
              className={active ? "p-tab-pill is-active" : "p-tab-pill"}
              aria-current={active ? "true" : undefined}
            >
              {t.label} <span className="n">{t.n}</span>
            </Link>
          );
        })}
      </div>

      <form className="p-filter" method="get">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <input
          className="p-input"
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, phone, email, message"
          aria-label="Search leads"
        />
        <select
          className="p-input p-select"
          name="source"
          defaultValue={source ?? ""}
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {sourceLabel(s)}
            </option>
          ))}
        </select>
        <button className="p-btn" type="submit">
          Filter
        </button>
        {hasFilter ? (
          <Link className="p-link" href="/portal/leads">
            Clear
          </Link>
        ) : null}
      </form>

      {res.rows.length === 0 ? (
        <div className="p-panel">
          <div className="p-leads-empty">
            <h2>{hasFilter ? "No leads match these filters" : "No leads yet"}</h2>
            <p className="p-muted">
              {hasFilter
                ? "Try clearing the search or picking a different status."
                : "They will appear here the moment someone calls or submits your form."}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-panel">
          <ul className="p-leadlist">
            {res.rows.map((lead) => (
              <li key={lead.id}>
                <Link className="p-leadrow" href={`/portal/leads/${lead.id}`}>
                  <span className={`p-dot ${lead.status}`} aria-hidden="true" />
                  <span className="p-lr-name">
                    <span className="nm">{leadName(lead)}</span>
                    <span className="p-lr-meta">
                      <span className={`p-statustag ${lead.status}`}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                      <span className="p-src">{sourceLabel(lead.source)}</span>
                    </span>
                  </span>
                  <span className="p-lr-msg p-muted">
                    {lead.message ? lead.message.slice(0, 70) : "No message"}
                  </span>
                  <span className="p-lr-val">{money(lead.valueEstimate)}</span>
                  <span className="p-lr-age p-muted">{relativeTime(lead.createdAt)}</span>
                  <span className="p-chev" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-pager">
            <span className="p-muted p-small">
              Showing {startIdx + 1}
              {"\u2013"}
              {startIdx + res.rows.length} of {res.total}
            </span>
            <span className="p-pager-btns">
              {res.page > 1 ? (
                <Link className="p-btn" href={hrefWith(current, { page: res.page - 1 })}>
                  Previous
                </Link>
              ) : null}
              {res.hasMore > 0 ? (
                <Link className="p-btn" href={hrefWith(current, { page: res.page + 1 })}>
                  Next
                </Link>
              ) : null}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
