import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  getTenant,
  getPrimaryDomain,
  getConfig,
  listLeads,
} from "@/lib/queries";
import { formatDate, humanize } from "@/lib/format";
import { OPEN_LEAD_STATUSES } from "@/lib/lead-status";

export const dynamic = "force-dynamic";

export default async function TenantOverviewPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) notFound();

  const [domain, draft, published, leads] = await Promise.all([
    getPrimaryDomain(tenant.id),
    getConfig(tenant.id, "draft"),
    getConfig(tenant.id, "published"),
    listLeads(tenant.id),
  ]);

  const openSet = new Set<string>(OPEN_LEAD_STATUSES);
  const openLeads = leads.filter((l) => openSet.has(l.status)).length;
  const wonLeads = leads.filter((l) => l.status === "won").length;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>Account</h2>
        </div>
        <div className="card-body">
          <dl className="kv-grid">
            <div className="kv">
              <dt>Niche</dt>
              <dd>{humanize(tenant.niche)}</dd>
            </div>
            <div className="kv">
              <dt>Location</dt>
              <dd>
                {tenant.city}, {tenant.state}
              </dd>
            </div>
            <div className="kv">
              <dt>Plan</dt>
              <dd>
                <span className="badge plan">{tenant.plan}</span>
              </dd>
            </div>
            <div className="kv">
              <dt>Status</dt>
              <dd>
                <span className={`badge status-${tenant.status}`}>
                  {tenant.status}
                </span>
              </dd>
            </div>
            <div className="kv">
              <dt>Primary domain</dt>
              <dd>
                {domain ? (
                  <span className="mono">{domain}</span>
                ) : (
                  <span className="muted">none yet</span>
                )}
              </dd>
            </div>
            <div className="kv">
              <dt>Service areas</dt>
              <dd>
                {tenant.serviceAreas.length > 0 ? (
                  `${tenant.serviceAreas.length} cities`
                ) : (
                  <span className="muted">-</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="stat-row" style={{ marginTop: "20px" }}>
        <div className="stat-card">
          <span className="stat-value">{leads.length}</span>
          <span className="stat-label">Total leads</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{openLeads}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{wonLeads}</span>
          <span className="stat-label">Won</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-head">
          <h2>Site config</h2>
        </div>
        <div className="card-body">
          <dl className="kv-grid">
            <div className="kv">
              <dt>Published version</dt>
              <dd>
                {published ? (
                  `v${published.version}`
                ) : (
                  <span className="muted">not published</span>
                )}
              </dd>
            </div>
            <div className="kv">
              <dt>Last published</dt>
              <dd>
                {published?.publishedAt ? (
                  formatDate(published.publishedAt)
                ) : (
                  <span className="muted">-</span>
                )}
              </dd>
            </div>
            <div className="kv">
              <dt>Draft</dt>
              <dd>
                {draft ? (
                  `${draft.pages.length} page${draft.pages.length === 1 ? "" : "s"}`
                ) : (
                  <span className="muted">none</span>
                )}
              </dd>
            </div>
          </dl>
          <p className="muted small" style={{ marginTop: "14px" }}>
            Draft editing, live preview, and publish arrive in the next update.
          </p>
        </div>
      </div>
    </>
  );
}
