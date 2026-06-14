/**
 * SMS delivery via Twilio's REST API (no SDK dependency - uses fetch).
 *
 * Degrades when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
 * are unset: `smsEnabled` is false and sendSms() no-ops with
 * { ok: false, skipped: true }. Never throws - returns a result instead.
 */
import type { SendResult } from "./email";

export const smsEnabled =
  !!process.env.TWILIO_ACCOUNT_SID &&
  !!process.env.TWILIO_AUTH_TOKEN &&
  !!process.env.TWILIO_FROM_NUMBER;

export interface SendSmsInput {
  to: string;
  body: string;
}

export async function sendSms(input: SendSmsInput): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    return { ok: false, skipped: true, error: "sms not configured" };
  }
  try {
    // Basic auth: base64("SID:TOKEN"). Both are ASCII, so btoa is safe and
    // avoids a Node Buffer type dependency.
    const auth = btoa(`${sid}:${token}`);
    const params = new URLSearchParams({
      To: input.to,
      From: from,
      Body: input.body,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `twilio ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { sid?: string };
    return { ok: true, id: data.sid };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "sms send failed",
    };
  }
}
