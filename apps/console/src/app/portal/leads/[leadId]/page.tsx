import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortal } from "@/lib/portal";
import {
  getPortalLead,
  listLeadActivities,
  type LeadActivityRow,
} from "@/lib/portal-leads";
import { relativeTime, formatDate } from "@/lib/format";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  isLeadStatus,
} from "@/lib/lead-status";
import {
  updatePortalLeadStatus,
  addPortalNote,
  updatePortalLeadValue,
} from "../actions";

export const dynamic = "force-dynamic";

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

function statusChangeText(body: string | null): string {
  if (!body) return "Status changed";
  const [from, to] = body.split(" -> ");
  if (from && to) {
    const f = isLeadStatus(from) ? LEAD_STATUS_LABELS[from] : from;
    const t = isLeadStatus(to) ? LEAD_STATUS_LABELS[to] : to;
    return `Status changed from ${f} to ${t}`;
  }
  return body;
}

function digits(s: string): string {
  return s.replace(/[^0-9+]/g, "");
}

export default async function PortalLeadDetail({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const ctx = await requirePortal();
  const lead = await getPortalLead(ctx.tenant.id, leadId);
  if (!lead) notFound();

  const activities = await listLeadActivities(ctx.tenant.id, leadId);
  const title = lead.name || lead.phone || "No name yet";
  const isWon = lead.status === "won";
  const valueDefault = lead.valueEstimate ? String(Number(lead.valueEstimate)) : "";

  return (
    <>
      <div className="p-detail-head">
        <Link className="p-back" href="/portal/leads">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Leads
        </Link>
        <div className="p-detail-title">
          <h1>{title}</h1>
          <span className={`p-statustag ${lead.status}`}>
            {LEAD_STATUS_LABELS[lead.status]}
          </span>
        </div>
        <form action={updatePortalLeadStatus} className="p-status-form">
          <input type="hidden" name="leadId" value={lead.id} />
          <label className="p-field-lbl" htmlFor="lead-status">
            Status
          </label>
          <select
            id="lead-status"
            name="status"
            defaultValue={lead.status}
            className="p-input p-select"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button type="submit" className="p-btn">
            Update
          </button>
        </form>
      </div>

      <div className="p-detail-cols">
        {/* left: contact + actions */}
        <div className="p-panel">
          <div className="p-panel-head">
            <h2>Contact</h2>
          </div>
          <div className="p-detail-body">
            <div className="p-field">
              <span className="p-field-lbl">Phone</span>
              {lead.phone ? (
                <div className="p-field-val">
                  <span className="p-mono">{lead.phone}</span>
                  <span className="p-inline-actions">
                    <a className="p-btn sm" href={`tel:${digits(lead.phone)}`}>
                      Call
                    </a>
                    <a className="p-btn sm" href={`sms:${digits(lead.phone)}`}>
                      Text
                    </a>
                  </span>
                </div>
              ) : (
                <span className="p-muted">Not provided</span>
              )}
            </div>

            <div className="p-field">
              <span className="p-field-lbl">Email</span>
              {lead.email ? (
                <div className="p-field-val">
                  <span className="p-mono">{lead.email}</span>
                  <span className="p-inline-actions">
                    <a className="p-btn sm" href={`mailto:${lead.email}`}>
                      Email
                    </a>
                  </span>
                </div>
              ) : (
                <span className="p-muted">Not provided</span>
              )}
            </div>

            <div className="p-field">
              <span className="p-field-lbl">Source</span>
              <span className="p-field-val">
                <span className="p-src">{sourceLabel(lead.source)}</span>
                <span className="p-muted p-small" style={{ marginLeft: "8px" }}>
                  {relativeTime(lead.createdAt)}
                </span>
              </span>
            </div>

            <div className="p-field">
              <span className="p-field-lbl">Estimated value</span>
              <form action={updatePortalLeadValue} className="p-value-form">
                <input type="hidden" name="leadId" value={lead.id} />
                <span className="p-value-input">
                  <span className="p-value-prefix">$</span>
                  <input
                    className="p-input"
                    name="value"
                    inputMode="decimal"
                    defaultValue={valueDefault}
                    placeholder="0"
                    aria-label="Estimated value in dollars"
                  />
                </span>
                <button type="submit" className="p-btn">
                  Save
                </button>
              </form>
            </div>

            <div className="p-field">
              <span className="p-field-lbl">Message</span>
              {lead.message ? (
                <p className="p-message">{lead.message}</p>
              ) : (
                <span className="p-muted">No message</span>
              )}
            </div>

            <div className="p-winlose">
              <form action={updatePortalLeadStatus}>
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="status" value="won" />
                <button type="submit" className="p-btn primary" disabled={isWon}>
                  Mark won
                </button>
              </form>
              <form action={updatePortalLeadStatus}>
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="status" value="lost" />
                <button
                  type="submit"
                  className="p-btn"
                  disabled={lead.status === "lost"}
                >
                  Mark lost
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* right: activity timeline + composer */}
        <div className="p-panel">
          <div className="p-panel-head">
            <h2>Activity</h2>
          </div>

          <form action={addPortalNote} className="p-note-form">
            <input type="hidden" name="leadId" value={lead.id} />
            <textarea
              name="note"
              className="p-textarea"
              rows={3}
              placeholder="Add a note (e.g. left a voicemail, sent a quote)"
              aria-label="Add a note"
            />
            <div className="p-note-actions">
              <button type="submit" className="p-btn primary">
                Save note
              </button>
            </div>
          </form>

          <ol className="p-timeline">
            {activities.map((a: LeadActivityRow) => (
              <li className="p-tl-item" key={a.id}>
                <span className={`p-tl-dot ${a.kind}`} aria-hidden="true" />
                <div className="p-tl-main">
                  <span className="p-tl-text">
                    {a.kind === "status_change"
                      ? statusChangeText(a.body)
                      : a.body}
                  </span>
                  <span className="p-tl-meta">
                    {a.actor ? `${a.actor} \u00b7 ` : ""}
                    {relativeTime(a.createdAt)}
                  </span>
                </div>
              </li>
            ))}
            <li className="p-tl-item">
              <span className="p-tl-dot created" aria-hidden="true" />
              <div className="p-tl-main">
                <span className="p-tl-text">
                  Lead created via {sourceLabel(lead.source)}
                </span>
                <span className="p-tl-meta">{formatDate(lead.createdAt)}</span>
              </div>
            </li>
          </ol>

          {isWon ? (
            <div className="p-won-cta">
              <span className="p-won-lbl">This lead is won. Nice work.</span>
              <div className="p-won-btns">
                <span className="p-btn is-disabled" title="Reviews engine arrives soon">
                  Send review request
                </span>
                <span className="p-btn is-disabled" title="Client invoicing arrives in Phase 2">
                  Create invoice
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
