import { findTenantBySlug, createCallLead } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Twilio inbound-voice webhook (stub).
 *
 * Twilio POSTs application/x-www-form-urlencoded call metadata here when a
 * tracking number rings. Until per-tenant number provisioning exists
 * (Week 4 onboarding), the tenant is resolved from a `?tenant=<slug>` query
 * param configured on the Twilio number's webhook URL. When resolved, the
 * call is recorded as a new lead (source: "call"); either way we return
 * valid TwiML so the caller flow never breaks.
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
    await createCallLead({
      tenantId: tenant.id,
      name: callerName,
      phone: from,
      callSid,
    });
  } catch (err) {
    // Never fail the call flow on a logging error.
    console.error("[twilio/voice] failed to record call lead", err);
  }

  return twiml(said);
}
