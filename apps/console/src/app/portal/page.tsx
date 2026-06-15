import { requirePortal } from "@/lib/portal";
import { getDashboard } from "@/lib/portal-queries";
import { getSubscription, type LeadRow } from "@/lib/queries";
import { relativeTime, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  growth: "Growth",
  scale: "Scale",
};
const SUB_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  unpaid: "Unpaid",
  canceled: "Canceled",
  incomplete: "Incomplete",
  incomplete_expired: "Incomplete",
  paused: "Paused",
};

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(name: string | null): string {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0] || "there";
}

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function trend(thisM: number, lastM: number): { dir: string; text: string } {
  if (lastM === 0 && thisM === 0) return { dir: "flat", text: "no change" };
  if (lastM === 0) return { dir: "up", text: "new" };
  const pct = Math.round(((thisM - lastM) / lastM) * 100);
  if (pct === 0) return { dir: "flat", text: "0%" };
  return { dir: pct > 0 ? "up" : "down", text: `${pct > 0 ? "+" : ""}${pct}%` };
}

function leadName(lead: LeadRow): string {
  return lead.name || lead.phone || "No name yet";
}

function Sparkline({ data }: { data: number[] }) {
  const pts = data.length >= 2 ? data : [...data, ...data];
  const max = Math.max(1, ...pts);
  const w = 100;
  const h = 26;
  const step = pts.length > 1 ? w / (pts.length - 1) : w;
  const coords = pts.map((v, i) => {
    const x = (i * step).toFixed(1);
    const y = (h - 2 - (v / max) * (h - 4)).toFixed(1);
    return `${x},${y}`;
  });
  return (
    <svg className="p-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 10 17l9-10" />
    </svg>
  );
}

export default async function PortalDashboard() {
  const ctx = await requirePortal();
  const d = await getDashboard(ctx.tenant.id);
  const sub = await getSubscription(ctx.tenant.id);

  const now = new Date();
  const planKey = sub?.plan ?? ctx.tenant.plan;
  const planText = PLAN_LABELS[planKey] ?? planKey;

  if (!d.hasAnyData) {
    return (
      <>
        <div className="p-greet">
          <div>
            <h1>
              {greeting(now)}, {firstName(ctx.name)}.
            </h1>
            <p>Here is your business at a glance. It fills in as leads come in.</p>
          </div>
        </div>
        <div className="p-empty">
          <h2>Welcome to your console</h2>
          <p>
            This is where you will see every lead, call, and change to your site.
            A couple of quick steps make sure nothing slips through.
          </p>
          <div className="p-check">
            <div className="p-check-item">
              <span className="p-check-num">1</span>
              <span className="p-check-main">
                <span className="p-check-title">Set who gets lead alerts</span>
                <span className="p-check-sub">
                  Add the phone and email that should be notified the moment a
                  lead arrives. (Notification settings - coming in the next update.)
                </span>
              </span>
            </div>
            <div className="p-check-item">
              <span className="p-check-num">2</span>
              <span className="p-check-main">
                <span className="p-check-title">Review your site details</span>
                <span className="p-check-sub">
                  Confirm your hours, phone, and service areas are right.
                </span>
              </span>
            </div>
            <div className="p-check-item">
              <span className="p-check-num">3</span>
              <span className="p-check-main">
                <span className="p-check-title">Watch your first lead land here</span>
                <span className="p-check-sub">
                  Every call and form submission shows up on this dashboard.
                </span>
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }

  const leadsTrend = trend(d.leadsThisMonth, d.leadsLastMonth);

  return (
    <>
      <div className="p-greet">
        <div>
          <h1>
            {greeting(now)}, {firstName(ctx.name)}.
          </h1>
          <p>Here is how {ctx.tenant.businessName} is doing this month.</p>
        </div>
        <span className="p-period">This month</span>
      </div>

      {/* KPI cards */}
      <div className="p-kpis">
        <div className="p-kpi accent">
          <span className="p-kpi-head">Leads</span>
          <div className="p-kpi-row">
            <span className="p-kpi-value">{d.leadsThisMonth}</span>
            <span className={`p-trend ${leadsTrend.dir}`}>{leadsTrend.text}</span>
          </div>
          <Sparkline data={d.sparkline} />
        </div>

        <div className="p-kpi">
          <span className="p-kpi-head">Calls</span>
          <div className="p-kpi-row">
            <span className="p-kpi-value">{d.callsThisMonth}</span>
          </div>
          <span className="p-kpi-sub">leads from calls</span>
        </div>

        <div className="p-kpi soon-card">
          <span className="p-kpi-head">Reviews</span>
          <div className="p-kpi-row">
            <span className="p-kpi-value p-muted">--</span>
          </div>
          <span className="p-kpi-sub">reviews engine arrives soon</span>
        </div>

        <div className="p-kpi">
          <span className="p-kpi-head">Est. pipeline</span>
          <div className="p-kpi-row">
            <span className="p-kpi-value">{money(d.pipelineValue)}</span>
          </div>
          <span className="p-kpi-sub">
            from {d.pipelineLeadCount} {d.pipelineLeadCount === 1 ? "lead" : "leads"} with a value
          </span>
        </div>
      </div>

      {/* recent leads + what's new */}
      <div className="p-cols">
        <div className="p-panel">
          <div className="p-panel-head">
            <h2>Recent leads</h2>
          </div>
          {d.recentLeads.length === 0 ? (
            <div style={{ padding: "16px" }} className="p-muted p-small">
              No leads yet. They will appear here the moment someone calls or
              submits your form.
            </div>
          ) : (
            <>
              {d.recentLeads.map((lead) => (
                <div className="p-lead" key={lead.id}>
                  <span className={`p-dot ${lead.status}`} />
                  <span className="p-lead-main">
                    <span className="p-lead-name">{leadName(lead)}</span>
                    <span className="p-lead-sub">
                      <span className="p-src">{lead.source}</span>
                      {lead.message ? <span className="p-muted">{lead.message.slice(0, 48)}</span> : null}
                    </span>
                  </span>
                  <span className="p-lead-age">{relativeTime(lead.createdAt)}</span>
                </div>
              ))}
              <div className="p-panel-foot">
                <span className="p-muted p-small">
                  Full leads workspace - coming in the next update.
                </span>
              </div>
            </>
          )}
        </div>

        <div className="p-panel">
          <div className="p-panel-head">
            <h2>What is new from your team</h2>
          </div>
          {d.whatsNew.length === 0 ? (
            <div style={{ padding: "16px" }} className="p-muted p-small">
              Updates your team publishes to your site will show up here.
            </div>
          ) : (
            <div className="p-feed">
              {d.whatsNew.map((item) => (
                <div className="p-feed-item" key={item.version}>
                  <span className="p-feed-ico">
                    <CheckIcon />
                  </span>
                  <span>
                    Site update published
                    <span className="p-muted">{" "}(v{item.version})</span>
                    <span className="p-feed-when">{relativeTime(item.at)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* quick actions (enabled as each screen ships) */}
      <div className="p-actions">
        <span className="p-btn primary is-disabled" title="Coming in the next update">
          Request a change
        </span>
        <span className="p-btn is-disabled" title="Reviews engine arrives soon">
          Send review requests
        </span>
        <span className="p-btn is-disabled" title="Client invoicing arrives in Phase 2">
          Create invoice
        </span>
      </div>

      {/* money strip */}
      <div className="p-money">
        <span className="p-money-item">
          <span className="lbl">Plan</span>
          <span className="val">
            {planText}
            {sub ? (
              <span className={`p-badge ${sub.status}`} style={{ marginLeft: "8px" }}>
                {SUB_LABELS[sub.status] ?? sub.status}
              </span>
            ) : (
              <span className="p-badge none" style={{ marginLeft: "8px" }}>
                Not set up
              </span>
            )}
          </span>
        </span>
        <span className="p-money-item">
          <span className="lbl">Next retainer charge</span>
          <span className="val">
            {sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "--"}
          </span>
        </span>
      </div>
    </>
  );
}
