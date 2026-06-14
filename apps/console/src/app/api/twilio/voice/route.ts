import {
  findTenantBySlug,
  createCallLead,
  type TenantRow,
} from "@/lib/queries";
import { db, schema } from "@platform/db";
import { notifyNewLead } from "@platform/notify";

export const dynamic = "force-dynamic";

/**
 * Twilio inbound-voice webhook (stub).
 *
 * Twilio POSTs application/x-www-form-urlencoded call metadata here when a
 * tracking number rings. Until per-tenant number provisioning exists
 * (Phase 1 onboarding), the tenant is resolved from a `?tenant=<slug>` query
 * param configured on the Twilio number's webhook URL. When resolved, the
 * call is recorded as a new lead (source: "call") and the business is
 * alerted (email/SMS); either way we return valid TwiML so the caller flow
 * never breaks.
 *
 * TODO(security): verify the X-Twilio-Signature header against the auth
 * token before trusting the payload, once Twilio credentials are wired.
 */
function twiml(message: string): Response {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${message}</Say></Response>`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

/** Alert the business about a new call lead, and log the attempts. Never
 *  throws - a notification problem must not break the call flow. */
async function notifyCallLead(
  tenant: TenantRow,
  caller: { name: string | null; phone: string | null },
  leadId: string | null
): Promise<void> {
  try {
    const outcomes = await notifyNewLead({
      business: tenant.businessName,
      lead: { source: "call", name: caller.name, phone: caller.phone },
      recipients: {
        email: tenant.notifyEmail,
        phone: tenant.notifyPhone,
        emailEnabled: tenant.notifyEmailEnabled,
        smsEnabled: tenant.notifySmsEnabled,
      },
    });
    if (outcomes.length > 0) {
      await db.insert(schema.notifications).values(
        outcomes.map((o) => ({
          tenantId: tenant.id,
          leadId,
          channel: o.channel,
          recipient: o.to,
          status: o.skipped
            ? ("skipped" as const)
            : o.ok
              ? ("sent" as const)
              : ("failed" as const),
          error: o.error ?? null,
          providerId: o.id ?? null,
        }))
      );
    }
  } catch (err) {
    console.error("[twilio/voice] notification dispatch failed", err);
  }
}

export async function POST(req: Request): Promise<Response> {
  const said =
    "Thanks for calling. Your call is important to us and someone will be in touch shortly.";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return twiml(said);
  }

  const callSid = form.get("CallSid")?.toString() ?? null;
  const from = form.get("From")?.toString() ?? null;
  const callerName = form.get("CallerName")?.toString() || null;

  const slug = new URL(req.url).searchParams.get("tenant");
  if (!slug) {
    console.warn("[twilio/voice] missing ?tenant= slug; call not recorded", {
      callSid,
    });
    return twiml(said);
  }

  try {
    const tenant = await findTenantBySlug(slug);
    if (!tenant) {
      console.warn("[twilio/voice] no tenant for slug", { slug, callSid });
      return twiml(said);
    }
    const leadId = await createCallLead({
      tenantId: tenant.id,
      name: callerName,
      phone: from,
      callSid,
    });
    await notifyCallLead(tenant, { name: callerName, phone: from }, leadId);
  } catch (err) {
    // Never fail the call flow on a logging error.
    console.error("[twilio/voice] failed to record call lead", err);
  }

  return twiml(said);
}
