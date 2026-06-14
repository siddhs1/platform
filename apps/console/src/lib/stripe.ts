import "server-only";
import Stripe from "stripe";

/**
 * Stripe wiring for the agency's own retainer billing.
 *
 * Mirrors the lazy/degrade pattern used for the DB client and Clerk:
 * nothing connects at import time and the whole surface is optional. When
 * STRIPE_SECRET_KEY is unset, `stripeEnabled` is false and callers render
 * a "not configured" state instead of touching the SDK.
 */

export const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

let client: Stripe | null = null;

/**
 * Memoized Stripe client. Throws if called without a secret key, so guard
 * with `stripeEnabled` first. apiVersion is intentionally omitted: the SDK
 * then uses the version its types are generated against, avoiding the
 * type drift that pinning a mismatched apiVersion string causes.
 */
export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  client = new Stripe(key);
  return client;
}

export function stripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

type PlanTier = "basic" | "growth" | "scale";

const PLAN_PRICE_ENV: Record<PlanTier, string> = {
  basic: "STRIPE_PRICE_BASIC",
  growth: "STRIPE_PRICE_GROWTH",
  scale: "STRIPE_PRICE_SCALE",
};

/** Stripe price id configured for a plan tier, or null when unset. */
export function priceIdForPlan(plan: PlanTier): string | null {
  return process.env[PLAN_PRICE_ENV[plan]] ?? null;
}

/**
 * Reverse-map a Stripe price id back to a plan tier. Defaults to "growth"
 * when the price is unrecognised (e.g. a legacy price id) so a subscription
 * always resolves to a valid tier.
 */
export function planForPriceId(priceId: string | null | undefined): PlanTier {
  if (!priceId) return "growth";
  const plans: PlanTier[] = ["basic", "growth", "scale"];
  for (const plan of plans) {
    if (process.env[PLAN_PRICE_ENV[plan]] === priceId) return plan;
  }
  return "growth";
}
