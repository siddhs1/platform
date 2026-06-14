/**
 * Email delivery via Resend's REST API (no SDK dependency - uses fetch).
 *
 * Degrades like the rest of the platform: when RESEND_API_KEY / RESEND_FROM
 * are unset, `emailEnabled` is false and sendEmail() no-ops with
 * { ok: false, skipped: true }. Never throws - returns a result instead.
 */

export const emailEnabled =
  !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM;

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  /** True when no attempt was made because the channel is not configured. */
  skipped?: boolean;
  /** Provider message id on success. */
  id?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    return { ok: false, skipped: true, error: "email not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `resend ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "email send failed",
    };
  }
}
