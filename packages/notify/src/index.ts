/**
 * @platform/notify - transactional notifications (email + SMS).
 *
 * Pure I/O with no DB dependency: callers pass plain data and recipients,
 * and are responsible for persisting the returned outcomes (e.g. to a
 * `notifications` log table). Each channel degrades independently via the
 * `emailEnabled` / `smsEnabled` flags. The first tool of the Phase 1
 * notifications spine: instant new-lead alerts.
 */
import { emailEnabled, sendEmail } from "./email";
import { smsEnabled, sendSms } from "./sms";

export { emailEnabled, sendEmail } from "./email";
export type { SendEmailInput, SendResult } from "./email";
export { smsEnabled, sendSms } from "./sms";
export type { SendSmsInput } from "./sms";

export interface NotifyLead {
  /** form | call | sms | booking */
  source: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
}

export interface NotifyRecipients {
  email?: string | null;
  phone?: string | null;
  /** Defaults to true when undefined. */
  emailEnabled?: boolean;
  /** Defaults to true when undefined. */
  smsEnabled?: boolean;
}

export interface NewLeadNotifyInput {
  business: string;
  /** Optional deep link to the lead in the console (included in email). */
  link?: string | null;
  lead: NotifyLead;
  recipients: NotifyRecipients;
}

export interface ChannelOutcome {
  channel: "email" | "sms";
  to: string;
  ok: boolean;
  skipped: boolean;
  id?: string;
  error?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}\u2026` : s;
}

export interface RenderedLead {
  subject: string;
  text: string;
  html: string;
  sms: string;
}

/** Build the email + SMS bodies for a new-lead alert. */
export function renderNewLead(input: NewLeadNotifyInput): RenderedLead {
  const { business, lead, link } = input;
  const who =
    lead.name?.trim() ||
    lead.phone?.trim() ||
    lead.email?.trim() ||
    "Someone";
  const verb =
    lead.source === "call"
      ? "called"
      : lead.source === "sms"
        ? "sent a text"
        : lead.source === "booking"
          ? "booked an appointment"
          : "submitted a form";

  const subject = `New lead for ${business}: ${who}`;

  const lines = [
    `${who} ${verb}.`,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.message ? `Message: ${lead.message}` : null,
  ].filter((x): x is string => !!x);

  const text = lines.join("\n") + (link ? `\n\nView: ${link}` : "");

  const rows = lines
    .map((l) => `<p style="margin:4px 0">${escapeHtml(l)}</p>`)
    .join("");
  const cta = link
    ? `<p style="margin:16px 0"><a href="${escapeHtml(link)}">View lead</a></p>`
    : "";
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;color:#16202b"><h2 style="margin:0 0 8px">New lead for ${escapeHtml(
    business
  )}</h2>${rows}${cta}</div>`;

  const smsParts = [`New lead for ${business}: ${who}`];
  if (lead.phone) smsParts.push(`(${lead.phone})`);
  if (lead.message) smsParts.push(`- ${truncate(lead.message, 80)}`);
  const sms = smsParts.join(" ");

  return { subject, text, html, sms };
}

/**
 * Send new-lead alerts to a tenant's configured recipients across the
 * channels that are both enabled for the tenant and configured at the
 * platform level. Returns one outcome per attempted channel (including
 * skipped ones, so the caller can log why nothing was sent). Never throws.
 */
export async function notifyNewLead(
  input: NewLeadNotifyInput
): Promise<ChannelOutcome[]> {
  const msg = renderNewLead(input);
  const { recipients } = input;
  const outcomes: ChannelOutcome[] = [];

  const email = recipients.email?.trim() ?? "";
  if (recipients.emailEnabled !== false && email) {
    if (!emailEnabled) {
      outcomes.push({
        channel: "email",
        to: email,
        ok: false,
        skipped: true,
        error: "email not configured",
      });
    } else {
      const r = await sendEmail({
        to: email,
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      });
      outcomes.push({
        channel: "email",
        to: email,
        ok: r.ok,
        skipped: !!r.skipped,
        id: r.id,
        error: r.error,
      });
    }
  }

  const phone = recipients.phone?.trim() ?? "";
  if (recipients.smsEnabled !== false && phone) {
    if (!smsEnabled) {
      outcomes.push({
        channel: "sms",
        to: phone,
        ok: false,
        skipped: true,
        error: "sms not configured",
      });
    } else {
      const r = await sendSms({ to: phone, body: msg.sms });
      outcomes.push({
        channel: "sms",
        to: phone,
        ok: r.ok,
        skipped: !!r.skipped,
        id: r.id,
        error: r.error,
      });
    }
  }

  return outcomes;
}
