import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortal } from "@/lib/portal";
import {
  getPortalRequest,
  parseRequest,
  CHANGE_STATUS_LABELS,
  type ChangeStatus,
} from "@/lib/portal-requests";
import { formatDate, relativeTime } from "@/lib/format";
import { approveRequest, requestChanges } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_NOTE: Record<ChangeStatus, string> = {
  queued: "Your team has this in the queue and will start on it soon.",
  in_progress: "Your team is working on this change now.",
  preview_ready:
    "Your team has prepared this update. Review it and approve to publish, or ask for changes.",
  approved: "Approved. Your team will publish this to your site shortly.",
  published: "This change is published and live on your site.",
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const ctx = await requirePortal();
  const req = await getPortalRequest(ctx.tenant.id, requestId);
  if (!req) notFound();

  const parsed = parseRequest(req.description);
  const canApprove = req.status === "preview_ready";
  const isDone = req.status === "approved" || req.status === "published";

  return (
    <>
      <div className="p-detail-head">
        <Link className="p-back" href="/portal/requests">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Requests
        </Link>
        <div className="p-detail-title">
          <h1>{parsed.title}</h1>
          <span className={`p-reqpill ${req.status}`}>
            {CHANGE_STATUS_LABELS[req.status]}
          </span>
        </div>
      </div>

      <div className="p-detail-cols">
        {/* left: the request */}
        <div className="p-panel">
          <div className="p-panel-head">
            <h2>Request</h2>
          </div>
          <div className="p-detail-body">
            <div className="p-field-val">
              {parsed.kind ? <span className="p-req-kind">{parsed.kind}</span> : null}
              {parsed.page ? (
                <span className="p-src">{parsed.page}</span>
              ) : null}
            </div>
            <div className="p-field">
              <span className="p-field-lbl">Details</span>
              <p className="p-message">{parsed.body || "No description"}</p>
            </div>
            <div className="p-field">
              <span className="p-field-lbl">Submitted</span>
              <span className="p-field-val">
                <span>{req.requestedBy}</span>
                <span className="p-muted p-small">
                  {formatDate(req.createdAt)} ({relativeTime(req.createdAt)})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* right: status + approval */}
        <div className="p-panel">
          <div className="p-panel-head">
            <h2>Status</h2>
          </div>
          <div className="p-detail-body">
            <div className={`p-statusnote ${req.status}`}>
              <span className={`p-reqdot ${req.status}`} aria-hidden="true" />
              <span>{STATUS_NOTE[req.status]}</span>
            </div>

            {canApprove ? (
              <div className="p-approve">
                <form action={approveRequest}>
                  <input type="hidden" name="requestId" value={req.id} />
                  <button type="submit" className="p-btn primary">
                    Approve and publish
                  </button>
                </form>
                <form action={requestChanges}>
                  <input type="hidden" name="requestId" value={req.id} />
                  <button type="submit" className="p-btn">
                    Request changes
                  </button>
                </form>
              </div>
            ) : null}

            {isDone ? (
              <div className="p-banner ok" style={{ margin: 0 }}>
                {req.status === "published"
                  ? "Live on your site."
                  : "Approved. Publishing shortly."}
              </div>
            ) : null}

            <p className="p-muted p-small" style={{ marginTop: "4px" }}>
              When a preview is ready, your team shares it here and you approve
              before anything goes live. A full conversation thread and file
              attachments are coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
