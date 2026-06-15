"use server";

import { redirect } from "next/navigation";
import { requirePortal } from "@/lib/portal";
import { stripeEnabled } from "@/lib/stripe";
import { createPortalBillingPortal } from "@/lib/portal-billing";

/**
 * Open the Stripe Billing Portal for the signed-in client's tenant. The
 * tenant comes from the session (requirePortal), never the form. redirect()
 * throws NEXT_REDIRECT, so errorRedirect returns `never` and composes inside
 * .catch() without widening the awaited type (mirrors the operator billing
 * action).
 */
function errorRedirect(msg: string): never {
  redirect(`/portal/billing?err=${encodeURIComponent(msg)}`);
}

export async function openPortalBilling(): Promise<void> {
  const ctx = await requirePortal();

  if (!stripeEnabled) {
    errorRedirect("Billing is not set up yet");
  }
  if (!ctx.tenant.stripeCustomerId) {
    errorRedirect("No billing account yet");
  }

  const url = await createPortalBillingPortal(ctx.tenant).catch(
    (err: unknown) => {
      const reason =
        err instanceof Error ? err.message : "Could not open billing";
      return errorRedirect(reason);
    }
  );
  redirect(url);
}
