import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getTenant } from "@/lib/queries";
import { listDomains } from "@/lib/domains";
import { cloudflareEnabled, dnsTarget } from "@/lib/cloudflare";
import { addDomain, refreshDomain } from "./actions";

export const dynamic = "force-dynamic";

const SSL_CLASS: Record<string, string> = {
  active: "status-live",
  pending: "status-onboarding",
  failed: "status-paused",
};
const SSL_LABEL: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  failed: "Failed",
};

export default async function DomainsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{
    added?: string | string[];
    refreshed?: string | string[];
    err?: string | string[];
  }>;
}) {
  const { tenantId } = await params;
  const sp = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) notFound();

  const domains = await listDomains(tenant.id);

  return (
    <>
      {first(sp.added) ? <div className="banner ok">Hostname added.</div> : null}
      {first(sp.refreshed) ? <div className="banner ok">SSL status refreshed.</div> : null}
      {first(sp.err) ? <div className="banner error">{first(sp.err)}</div> : null}

      <div className="card" style={{ marginBottom: "18px" }}>
        <div className="card-head">
          <h2>Domains</h2>
          <span className="muted small">
            {cloudflareEnabled ? "Cloudflare for SaaS connected" : "Cloudflare not configured"}
          </span>
        </div>
        {domains.length === 0 ? (
          <div className="card-body">
            <p className="muted" style={{ margin: 0 }}>No domains yet. Add one below.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Hostname</th>
                <th>Primary</th>
                <th>SSL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id}>
                  <td className="mono">{d.hostname}</td>
                  <td>{d.isPrimary ? <span className="badge plan">Primary</span> : ""}</td>
                  <td>
                    <span className={`badge ${SSL_CLASS[d.sslStatus] ?? "status-onboarding"}`}>
                      {SSL_LABEL[d.sslStatus] ?? d.sslStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {d.cfHostnameId ? (
                      <form action={refreshDomain}>
                        <input type="hidden" name="tenantId" value={tenant.id} />
                        <input type="hidden" name="domainId" value={d.id} />
                        <button type="submit" className="btn">Refresh</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginBottom: "18px", maxWidth: "640px" }}>
        <div className="card-head">
          <h2>Add a custom hostname</h2>
        </div>
        <div className="card-body">
          <form action={addDomain}>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div className="field">
              <label className="field-label" htmlFor="hostname">Hostname</label>
              <input id="hostname" name="hostname" className="input mono" placeholder="www.clientdomain.com" />
            </div>
            <div className="card-foot" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn primary">Add hostname</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "640px" }}>
        <div className="card-head">
          <h2>DNS instructions</h2>
        </div>
        <div className="card-body">
          <p className="muted small" style={{ marginTop: 0 }}>
            Ask the client to add this DNS record at their registrar:
          </p>
          <div className="kv-grid">
            <div>
              <div className="field-label">Type</div>
              <div className="mono">CNAME</div>
            </div>
            <div>
              <div className="field-label">Name</div>
              <div className="mono">www (or the chosen subdomain)</div>
            </div>
            <div>
              <div className="field-label">Value</div>
              <div className="mono">{dnsTarget()}</div>
            </div>
          </div>
          <p className="muted small">
            {cloudflareEnabled
              ? "Once the CNAME resolves, Cloudflare issues SSL automatically. Use Refresh to re-check status."
              : "Cloudflare is not configured, so SSL provisioning is manual for now. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID to automate it."}
          </p>
        </div>
      </div>
    </>
  );
}
