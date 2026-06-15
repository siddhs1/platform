import Link from "next/link";
import { requirePortal } from "@/lib/portal";
import {
  listPortalRequests,
  parseRequest,
  isOpenStatus,
  CHANGE_STATUS_LABELS,
  type ChangeRequestRow,
} from "@/lib/portal-requests";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function RequestRow({ req }: { req: ChangeRequestRow }) {
  const parsed = parseRequest(req.description);
  const attention = req.status === "preview_ready";
  return (
    <li>
      <Link className="p-reqrow" href={`/portal/requests/${req.id}`}>
        <span className={`p-reqdot ${req.status}`} aria-hidden="true" />
        <span className="p-req-main">
          <span className="p-req-title">{parsed.title}</span>
          <span className="p-req-meta">
            {parsed.kind ? <span className="p-req-kind">{parsed.kind}</span> : null}
            {parsed.page ? <span className="p-muted">{parsed.page}</span> : null}
          </span>
        </span>
        {attention ? (
          <span className="p-attn" title="A preview is ready for your approval">
            Action needed
          </span>
        ) : null}
        <span className={`p-reqpill ${req.status}`}>
          {CHANGE_STATUS_LABELS[req.status]}
        </span>
        <span className="p-req-age p-muted">{relativeTime(req.createdAt)}</span>
        <span className="p-chev" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </Link>
    </li>
  );
}

export default async function PortalRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; created?: string | string[] }>;
}) {
  const ctx = await requirePortal();
  const sp = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const tab = first(sp.tab) === "completed" ? "completed" : "open";
  const justCreated = first(sp.created) === "1";

  const all = await listPortalRequests(ctx.tenant.id);
  const open = all.filter((r) => isOpenStatus(r.status));
  const done = all.filter((r) => !isOpenStatus(r.status));
  const shown = tab === "completed" ? done : open;

  return (
    <>
      <div className="p-greet">
        <div>
          <h1>Requests</h1>
          <p>Ask your team for a change and approve it before it goes live.</p>
        </div>
        <Link className="p-btn primary" href="/portal/requests/new">
          New request
        </Link>
      </div>

      {justCreated ? (
        <div className="p-banner ok">
          Request submitted. Your team will take it from here and send a preview
          when it is ready.
        </div>
      ) : null}

      <div className="p-tabs" role="tablist" aria-label="Request status">
        <Link
          href="/portal/requests"
          className={tab === "open" ? "p-tab-pill is-active" : "p-tab-pill"}
          aria-current={tab === "open" ? "true" : undefined}
        >
          Open <span className="n">{open.length}</span>
        </Link>
        <Link
          href="/portal/requests?tab=completed"
          className={tab === "completed" ? "p-tab-pill is-active" : "p-tab-pill"}
          aria-current={tab === "completed" ? "true" : undefined}
        >
          Completed <span className="n">{done.length}</span>
        </Link>
      </div>

      {shown.length === 0 ? (
        <div className="p-panel">
          <div className="p-leads-empty">
            <h2>{tab === "completed" ? "Nothing completed yet" : "No open requests"}</h2>
            <p className="p-muted">
              {tab === "completed"
                ? "Approved and published changes will be listed here."
                : "Need a change to your site? Request it and your team will handle it."}
            </p>
            {tab === "open" ? (
              <div style={{ marginTop: "14px" }}>
                <Link className="p-btn primary" href="/portal/requests/new">
                  New request
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="p-panel">
          <ul className="p-reqlist">
            {shown.map((req) => (
              <RequestRow key={req.id} req={req} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
