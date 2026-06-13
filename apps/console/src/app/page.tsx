import Link from "next/link";
import { requireSession } from "@/lib/auth";
import {
  listTenants,
  newLeadCountsByTenant,
  type TenantRow,
} from "@/lib/queries";

// Hits the DB + auth on every request; never statically prerender.
export const dynamic = "force-dynamic";

function statusClass(status: TenantRow["status"]): string {
  return `badge status-${status}`;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const tenants = await listTenants(session);
  const leadCounts = await newLeadCountsByTenant(tenants.map((t) => t.id));

  const liveCount = tenants.filter((t) => t.status === "live").length;
  const newLeadTotal = Object.values(leadCounts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="page-sub">Every tenant on the platform, at a glance.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-value">{tenants.length}</span>
          <span className="stat-label">Clients</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{liveCount}</span>
          <span className="stat-label">Live sites</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-value">{newLeadTotal}</span>
          <span className="stat-label">New leads</span>
        </div>
      </div>

      {tenants.length === 0 ? (
        <div className="card empty">
          <h2>No tenants yet</h2>
          <p className="muted">
            Seed the database to create the three demo tenants, then refresh.
          </p>
          <div className="code-block mono">pnpm --filter @platform/db seed</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-head">
            <h2>Clients</h2>
            <span className="muted small">{tenants.length} total</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Niche</th>
                <th>Location</th>
                <th>Status</th>
                <th>Plan</th>
                <th className="num">New leads</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const n = leadCounts[t.id] ?? 0;
                return (
                  <tr key={t.id}>
                    <td>
                      <Link className="row-link" href={`/tenants/${t.id}`}>
                        {t.businessName}
                      </Link>
                      <div className="muted small mono">{t.slug}</div>
                    </td>
                    <td className="muted">{t.niche}</td>
                    <td className="muted">
                      {t.city}, {t.state}
                    </td>
                    <td>
                      <span className={statusClass(t.status)}>{t.status}</span>
                    </td>
                    <td>
                      <span className="badge plan">{t.plan}</span>
                    </td>
                    <td className="num">
                      {n > 0 ? (
                        <span className="pill-count">{n}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
