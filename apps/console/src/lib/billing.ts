import "server-only";
import { getStripe, priceIdForPlan } from "./stripe";
import { setTenantStripeCustomerId, type TenantRow } from "./queries";

/**
 * Billing helpers: plan/status presentation plus the Stripe flows the
 * console drives (customer bootstrap, Checkout, Billing Portal).
 *
 * Everything here assumes Stripe is configured; callers gate on
 * `stripeEnabled` (see stripe.ts) before invoking any of it.
 */

export type PlanTier = "basic" | "growth" | "scale";

export const SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * Narrow an arbitrary Stripe status string to our enum, defaulting to
 * "incomplete" for anything unexpected so a webhook write never fails on
 * an out-of-range value.
 */
export function toSubscriptionStatus(status: string): SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
    ? (status as SubscriptionStatus)
    : "incomplete";
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  incomplete: "Incomplete",
  incomplete_expired: "Incomplete (expired)",
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  paused: "Paused",
};

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  return STATUS_LABELS[status];
}

const PLAN_LABELS: Record<PlanTier, string> = {
  basic: "Basic",
  growth: "Growth",
  scale: "Scale",
};

export function planLabel(plan: PlanTier): string {
  return PLAN_LABELS[plan];
}

function consoleBaseUrl(): string {
  return process.env.CONSOLE_API_URL ?? "http://localhost:3001";
}

function billingUrl(tenantId: string): string {
  return `${consoleBaseUrl()}/tenants/${tenantId}/billing`;
}

/**
 * Return the tenant's Stripe customer id, creating and persisting one on
 * first use. The customer carries tenant metadata so webhook events can be
 * traced back to a tenant even before a subscription row exists.
 */
export async function ensureStripeCustomer(tenant: TenantRow): Promise<string> {
  if (tenant.stripeCustomerId) return tenant.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: tenant.businessName,
    metadata: { tenantId: tenant.id, slug: tenant.slug },
  });
  await setTenantStripeCustomerId(tenant.id, customer.id);
  return customer.id;
}

/**
 * Create a Checkout Session for a subscription on the given plan and return
 * its hosted URL. Throws if the plan has no configured price id.
 */
export async function createSubscriptionCheckout(
  tenant: TenantRow,
  plan: PlanTier
): Promise<string> {
  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    throw new Error(`No Stripe price configured for plan "${plan}"`);
  }
  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(tenant);
  const base = billingUrl(tenant.id);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}?started=1`,
    cancel_url: `${base}?canceled=1`,
    metadata: { tenantId: tenant.id, plan },
    subscription_data: {
      metadata: { tenantId: tenant.id, plan },
    },
  });
  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL");
  }
  return session.url;
}

/**
 * Create a Billing Portal session so the client can manage payment method,
 * invoices, or cancellation. Requires an existing Stripe customer.
 */
export async function createBillingPortalSession(
  tenant: TenantRow
): Promise<string> {
  if (!tenant.stripeCustomerId) {
    throw new Error("Tenant has no Stripe customer");
  }
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: billingUrl(tenant.id),
  });
  return session.url;
}
