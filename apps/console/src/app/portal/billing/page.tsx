import { requirePortal } from "@/lib/portal";
import { getPortalBilling, type ReceiptRow } from "@/lib/portal-billing";
import {
  planLabel,
  subscriptionStatusLabel,
  type PlanTier,
  type SubscriptionStatus,
} from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { openPortalBilling } from "./actions";

export const dynamic = "force-dynamic";

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function PortalBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string | string[] }>;
}) {
  const ctx = await requirePortal();
  const sp = await searchParams;
  const errRaw = Array.isArray(sp.err) ? sp.err[0] : sp.err;

  const billing = await getPortalBilling(ctx.tenant);
  const sub = billing.sub;
  const planKey = (sub?.plan ?? ctx.tenant.plan) as PlanTier;
  const status = sub?.status as SubscriptionStatus | undefined;
  const canManage = billing.configured && billing.hasCustomer;
  const pastDue = status === "past_due" || status === "unpaid";

  return (
    <>
      <div className="p-greet">
        <div>
          <h1>Billing</h1>
          <p>Your retainer plan and receipts.</p>
        </div>
      </div>

      {errRaw ? <div className="p-banner warn">{errRaw}</div> : null}
      {pastDue ? (
        <div className="p-banner warn">
          A recent payment did not go through. Update your payment method to
          keep your service active.
        </div>
      ) : null}
      {!billing.configured ? (
        <div className="p-banner">
          Billing is not set up yet. Your team will send a secure link to start
          your retainer.
        </div>
      ) : null}

      {/* plan card */}
      <div className="p-plancard">
        <div className="p-plan-top">
          <div>
            <span className="p-field-lbl">Plan</span>
            <div className="p-plan-name">
              {planLabel(planKey)}
              {sub ? (
                <span className={`p-badge ${sub.status}`}>
                  {subscriptionStatusLabel(status as SubscriptionStatus)}
                </span>
              ) : (
                <span className="p-badge none">Not set up</span>
              )}
            </div>
          </div>
          {canManage ? (
            <form action={openPortalBilling}>
              <button type="submit" className="p-btn primary">
                Manage billing
              </button>
            </form>
          ) : (
            <span
              className="p-btn is-disabled"
              title={
                billing.configured
                  ? "No billing account yet"
                  : "Billing is not set up yet"
              }
            >
              Manage billing
            </span>
          )}
        </div>
        <div className="p-plan-meta">
          <span className="p-money-item">
            <span className="lbl">Next charge</span>
            <span className="val">
              {sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "\u2014"}
            </span>
          </span>
          <span className="p-money-item">
            <span className="lbl">Payment method</span>
            <span className="val p-muted">
              {canManage ? "Managed on Stripe" : "\u2014"}
            </span>
          </span>
        </div>
        {canManage ? (
          <p className="p-muted p-small" style={{ margin: "4px 0 0" }}>
            Manage billing opens a secure Stripe page where you can update your
            card, view invoices, or change your plan.
          </p>
        ) : null}
      </div>

      {/* receipts */}
      <div className="p-panel">
        <div className="p-panel-head">
          <h2>Receipts</h2>
          {billing.receipts.length > 0 ? (
            <span className="muted small p-muted p-small">
              {billing.receipts.length} shown
            </span>
          ) : null}
        </div>
        {billing.receipts.length === 0 ? (
          <div className="p-leads-empty">
            <p className="p-muted" style={{ margin: 0 }}>
              {canManage
                ? "Your paid invoices will appear here."
                : "Receipts will appear here once your billing is active."}
            </p>
          </div>
        ) : (
          <ul className="p-receiptlist">
            {billing.receipts.map((r: ReceiptRow) => (
              <li className="p-receiptrow" key={r.id}>
                <span className="p-rc-date">{formatDate(r.created)}</span>
                <span className="p-rc-amt p-mono">
                  {money(r.amountPaid, r.currency)}
                </span>
                <span className="p-rc-status">
                  {r.status ? titleCase(r.status) : "\u2014"}
                </span>
                <span className="p-rc-pdf">
                  {r.pdfUrl || r.hostedUrl ? (
                    <a
                      className="p-link"
                      href={(r.pdfUrl ?? r.hostedUrl) as string}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    <span className="p-muted">{"\u2014"}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
