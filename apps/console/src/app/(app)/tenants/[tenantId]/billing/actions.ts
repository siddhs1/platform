"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getTenant } from "@/lib/queries";
import { stripeEnabled } from "@/lib/stripe";
import {
  createSubscriptionCheckout,
  createBillingPortalSession,
  type PlanTier,
} from "@/lib/billing";

function billingPath(tenantId: string): string {
  return `/tenants/${tenantId}/billing`;
}

/**
 * Redirect back to the billing tab with an error banner. Returns `never`
 * (redirect throws a NEXT_REDIRECT), so it composes inside a `.catch()`
 * without widening the resolved type of the awaited call.
 */
function errorRedirect(tenantId: string, msg: string): never {
  redirect(`${billingPath(tenantId)}?err=${encodeURIComponent(msg)}`);
}

const PLANS: readonly PlanTier[] = ["basic", "growth", "scale"];

function isPlan(value: string): value is PlanTier {
  return (PLANS as readonly string[]).includes(value);
}

export async function startSubscription(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return;
  const plan = String(formData.get("plan") ?? "");

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) return;

  if (!stripeEnabled) {
    errorRedirect(tenantId, "Billing is not configured");
  }
  if (!isPlan(plan)) {
    errorRedirect(tenantId, "Choose a valid plan");
  }

  // Keep redirect(url) OUTSIDE any try/catch: redirect() signals via a
  // thrown NEXT_REDIRECT, so catching the checkout error with `.catch`
  // (which itself redirects on failure) lets the happy path resolve to a
  // string while the final redirect is never accidentally swallowed.
  const url = await createSubscriptionCheckout(tenant, plan).catch(
    (err: unknown) => {
      const reason =
        err instanceof Error ? err.message : "Could not start checkout";
      return errorRedirect(tenantId, reason);
    }
  );
  redirect(url);
}

export async function openBillingPortal(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return;

  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) return;

  if (!stripeEnabled) {
    errorRedirect(tenantId, "Billing is not configured");
  }

  const url = await createBillingPortalSession(tenant).catch((err: unknown) => {
    const reason =
      err instanceof Error ? err.message : "Could not open billing portal";
    return errorRedirect(tenantId, reason);
  });
  redirect(url);
}
