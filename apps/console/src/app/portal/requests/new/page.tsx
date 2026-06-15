import Link from "next/link";
import { requirePortal } from "@/lib/portal";
import { REQUEST_KINDS, REQUEST_PAGES } from "@/lib/portal-requests";
import { createRequest } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  await requirePortal();
  const sp = await searchParams;
  const hasError = (Array.isArray(sp.error) ? sp.error[0] : sp.error) === "1";

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
          <h1>New request</h1>
        </div>
      </div>

      {hasError ? (
        <div className="p-banner warn">
          Please choose a type and describe the change you would like.
        </div>
      ) : null}

      <div className="p-panel" style={{ maxWidth: "640px" }}>
        <form action={createRequest} className="p-form">
          <div className="p-form-row">
            <label className="p-field-lbl" htmlFor="req-kind">
              Type of change
            </label>
            <select id="req-kind" name="kind" className="p-input p-select" defaultValue="">
              <option value="" disabled>
                Choose a type
              </option>
              {REQUEST_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="p-form-row">
            <label className="p-field-lbl" htmlFor="req-page">
              Which page (optional)
            </label>
            <select id="req-page" name="page" className="p-input p-select" defaultValue="">
              <option value="">Not sure / general</option>
              {REQUEST_PAGES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="p-form-row">
            <label className="p-field-lbl" htmlFor="req-body">
              What would you like changed?
            </label>
            <textarea
              id="req-body"
              name="body"
              className="p-textarea"
              rows={6}
              placeholder="Describe the change. The more detail, the faster your team can turn it around."
            />
          </div>

          <div className="p-form-foot">
            <span className="p-muted p-small">
              File attachments are coming soon. For now, describe the change and
              your team will follow up if they need assets.
            </span>
            <button type="submit" className="p-btn primary">
              Submit request
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
