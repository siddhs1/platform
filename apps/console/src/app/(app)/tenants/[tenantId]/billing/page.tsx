import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getTenant, getSubscription } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { stripeEnabled, priceIdForPlan } from "@/lib/stripe";
import { planLabel, subscriptionStatusLabel, type PlanTier } from "@/lib/billing";
import { startSubscription, openBillingPortal } from "./actions";

export const dynamic = "force-dynamic";

const PLAN_OPTIONS: readonly PlanTier[] = ["basic", "growth", "scale"];

// Statuses where the subscription is (or was recently) granting access;
// drives whether the period end reads as "Renews" vs "Period ends".
const ACTIVE_STATUSES = new Set<string>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{
    started?: string;
    canceled?: string;
    err?: string;
  }>;
}) {
  const { tenantId } = await params;
  const sp = await searchParams;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) notFound();

  const subscription = await getSubscription(tenant.id);
  const hasCustomer = !!tenant.stripeCustomerId;

  const status = subscription?.status ?? null;
  const badgeClass = status ? `sub-${status}` : "sub-none";
  const statusText = status
    ? subscriptionStatusLabel(status)
    : "No subscription";

  const periodEnd = subscription?.currentPeriodEnd ?? null;
  const periodLabel = subscription?.cancelAtPeriodEnd
    ? "Cancels on"
    : status && ACTIVE_STATUSES.has(status)
      ? "Renews"
      : "Period ends";

  return (
    <>
      {sp.err ? <div className="banner error">{sp.err}</div> : null}
      {sp.started ? (
        <div className="banner ok">
          Subscription started — it can take a moment to activate.
        </div>
      ) : null}
      {sp.canceled ? (
        <div className="banner">Checkout canceled — no charge was made.</div>
      ) : null}

      {!stripeEnabled ? (
        <div className="banner">
          Billing is not configured. Set{" "}
          <span className="mono">STRIPE_SECRET_KEY</span> and the plan price
          ids to enable subscriptions.
        </div>
      ) : null}

      {/* Current subscription */}
      <div className="card">
        <div className="card-head">
          <h2>Subscription</h2>
          <span className={`badge ${badgeClass}`}>{statusText}</span>
        </div>
        <div className="card-body">
          {subscription ? (
            <dl className="kv-grid">
              <div className="kv">
                <dt>Plan</dt>
                <dd>
                  <span className="badge plan">
                    {planLabel(subscription.plan)}
                  </span>
                </dd>
              </div>
              <div className="kv">
                <dt>Status</dt>
                <dd>{statusText}</dd>
              </div>
              <div className="kv">
                <dt>{periodLabel}</dt>
                <dd>{periodEnd ? formatDate(periodEnd) : "—"}</dd>
              </div>
              <div className="kv">
                <dt>Stripe customer</dt>
                <dd>
                  {tenant.stripeCustomerId ? (
                    <span className="mono small">
                      {tenant.stripeCustomerId}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="muted small">No subscription for this tenant yet.</p>
          )}
        </div>
      </div>

      {/* Start a subscription */}
      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-head">
          <h2>Start a subscription</h2>
        </div>
        <form action={startSubscription}>
          <input type="hidden" name="tenantId" value={tenant.id} />
          <div className="card-body">
            <div className="field">
              <label className="field-label" htmlFor="plan">
                Plan
              </label>
              <select
                id="plan"
                name="plan"
                defaultValue={tenant.plan}
                className="input"
              >
                {PLAN_OPTIONS.map((plan) => {
                  const configured = !!priceIdForPlan(plan);
                  return (
                    <option key={plan} value={plan} disabled={!configured}>
                      {planLabel(plan)}
                      {configured ? "" : " — no price configured"}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="muted small">
              Opens Stripe Checkout on a hosted page. Card details are entered
              on Stripe, never here.
            </p>
          </div>
          <div className="card-foot">
            <button
              type="submit"
              className="btn primary"
              disabled={!stripeEnabled}
            >
              Start checkout →
            </button>
          </div>
        </form>
      </div>

      {/* Manage billing */}
      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-head">
          <h2>Manage billing</h2>
        </div>
        <div className="card-body">
          <p className="muted small">
            Open the Stripe Billing Portal to update the payment method, view
            invoices, or cancel.
          </p>
        </div>
        <div className="card-foot">
          <form action={openBillingPortal}>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <button
              type="submit"
              className="btn"
              disabled={!stripeEnabled || !hasCustomer}
            >
              Open billing portal ↗
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
