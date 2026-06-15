import "server-only";
import { getStripe, stripeEnabled } from "./stripe";
import { getSubscription, type SubscriptionRow, type TenantRow } from "./queries";

/**
 * Billing read model + Stripe Billing Portal for the CLIENT PORTAL (B6).
 *
 * The client sees their own retainer subscription (from our subscriptions
 * table, which the Stripe webhook keeps as source of truth) and a read-only
 * list of receipts (Stripe invoices). Updating the card / managing billing
 * happens on Stripe's hosted Billing Portal (card data never touches us).
 * Starting a NEW subscription is an onboarding/operator action, not exposed
 * here. Everything degrades cleanly when Stripe is not configured.
 */

export interface ReceiptRow {
  id: string;
  number: string | null;
  amountPaid: number; // cents
  currency: string;
  status: string | null;
  created: Date;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

export interface PortalBilling {
  configured: boolean; // Stripe keys present
  hasCustomer: boolean; // tenant has a Stripe customer id
  sub: SubscriptionRow | null;
  receipts: ReceiptRow[];
}

function consoleBaseUrl(): string {
  return process.env.CONSOLE_API_URL ?? "http://localhost:3001";
}

export async function getPortalBilling(
  tenant: TenantRow
): Promise<PortalBilling> {
  const sub = await getSubscription(tenant.id);
  const hasCustomer = !!tenant.stripeCustomerId;

  let receipts: ReceiptRow[] = [];
  if (stripeEnabled && tenant.stripeCustomerId) {
    try {
      const stripe = getStripe();
      const list = await stripe.invoices.list({
        customer: tenant.stripeCustomerId,
        limit: 12,
      });
      receipts = list.data.map((inv) => ({
        id: inv.id ?? "",
        number: inv.number ?? null,
        amountPaid: inv.amount_paid ?? 0,
        currency: (inv.currency ?? "usd").toUpperCase(),
        status: inv.status ?? null,
        created: new Date((inv.created ?? 0) * 1000),
        hostedUrl: inv.hosted_invoice_url ?? null,
        pdfUrl: inv.invoice_pdf ?? null,
      }));
    } catch {
      // Never fail the page on a Stripe read; show no receipts instead.
      receipts = [];
    }
  }

  return {
    configured: stripeEnabled,
    hasCustomer,
    sub,
    receipts,
  };
}

/**
 * Create a Stripe Billing Portal session that returns to the client portal
 * billing page. Requires an existing Stripe customer; the caller guards on
 * stripeEnabled + customer first and catches errors.
 */
export async function createPortalBillingPortal(
  tenant: TenantRow
): Promise<string> {
  if (!tenant.stripeCustomerId) {
    throw new Error("No billing account yet");
  }
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${consoleBaseUrl()}/portal/billing`,
  });
  return session.url;
}
