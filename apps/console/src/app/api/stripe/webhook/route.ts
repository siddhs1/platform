import type Stripe from "stripe";
import {
  getStripe,
  stripeEnabled,
  stripeWebhookSecret,
  planForPriceId,
} from "@/lib/stripe";
import { toSubscriptionStatus } from "@/lib/billing";
import {
  setTenantStripeCustomerId,
  findTenantByStripeCustomerId,
  upsertSubscription,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook for the agency's own retainer billing.
 *
 * Stripe POSTs signed events here. We verify the signature against
 * STRIPE_WEBHOOK_SECRET, then fan out on event type. The webhook is the
 * source of truth for subscription state: upsertSubscription keys on the
 * Stripe subscription id so repeated or out-of-order deliveries converge.
 *
 * Degrades like the rest of the Stripe surface - if billing is not
 * configured we return 400 so Stripe surfaces the misconfiguration rather
 * than silently dropping events.
 */

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A Stripe customer reference can arrive as an id, an expanded object, or
 *  a deleted-customer object. Reduce all three to the id string. */
function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * Read the current period end defensively. Newer Stripe API versions moved
 * `current_period_end` off the subscription and onto its items; reading
 * both shapes via structural casts (no `any`) keeps this resilient to
 * where the pinned types place the field.
 */
function periodEndOf(sub: Stripe.Subscription): Date | null {
  const top = (sub as { current_period_end?: number }).current_period_end;
  if (typeof top === "number") return new Date(top * 1000);
  const item = sub.items?.data?.[0] as
    | { current_period_end?: number }
    | undefined;
  if (item && typeof item.current_period_end === "number") {
    return new Date(item.current_period_end * 1000);
  }
  return null;
}

async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = customerIdOf(sub.customer);
  if (!customerId) {
    console.warn("[stripe/webhook] subscription without customer", {
      subscriptionId: sub.id,
    });
    return;
  }

  // Prefer the tenant id stamped on the subscription metadata; fall back to
  // a reverse lookup by customer id (older subs, or events where metadata
  // was not present).
  let tenantId = sub.metadata?.tenantId ?? null;
  if (!tenantId) {
    const tenant = await findTenantByStripeCustomerId(customerId);
    tenantId = tenant?.id ?? null;
  }
  if (!tenantId) {
    console.warn("[stripe/webhook] no tenant for subscription", {
      subscriptionId: sub.id,
      customerId,
    });
    return;
  }

  const priceId = sub.items?.data?.[0]?.price?.id ?? null;

  await upsertSubscription({
    tenantId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status: toSubscriptionStatus(sub.status),
    plan: planForPriceId(priceId),
    priceId,
    currentPeriodEnd: periodEndOf(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
  });
}

export async function POST(req: Request): Promise<Response> {
  if (!stripeEnabled) {
    return jsonResponse({ error: "Billing is not configured" }, 400);
  }
  const secret = stripeWebhookSecret();
  if (!secret) {
    return jsonResponse({ error: "Webhook secret is not configured" }, 400);
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return jsonResponse({ error: "Missing stripe-signature header" }, 400);
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(body, sig, secret);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "invalid signature";
    console.warn("[stripe/webhook] signature verification failed", reason);
    return jsonResponse({ error: "Signature verification failed" }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        const tenantId = checkout.metadata?.tenantId;
        const customerId = customerIdOf(checkout.customer);
        if (tenantId && customerId) {
          await setTenantStripeCustomerId(tenantId, customerId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        // Logged for now; dunning / notifications land with Inngest (Phase 2).
        console.info(`[stripe/webhook] ${event.type}`, { id: event.id });
        break;
      }
      default:
        // Acknowledge unhandled types so Stripe stops retrying them.
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    return jsonResponse({ error: "Webhook handler failed" }, 500);
  }

  return jsonResponse({ received: true }, 200);
}
