/**
 * Public lead intake. The contact-form block posts here. Resolves the
 * tenant from the request hostname, writes a lead, and fires an instant
 * new-lead notification (email/SMS) to the business via @platform/notify.
 * Notification delivery never blocks or fails the form submission.
 */
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@platform/db";
import { eq } from "drizzle-orm";
import { notifyNewLead } from "@platform/notify";

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").replace(/^www\./, "");
  const form = await req.formData();

  // Resolve the tenant (with its notification recipients) by hostname.
  const tenantRows = await db
    .select({
      id: schema.tenants.id,
      businessName: schema.tenants.businessName,
      notifyEmail: schema.tenants.notifyEmail,
      notifyPhone: schema.tenants.notifyPhone,
      notifyEmailEnabled: schema.tenants.notifyEmailEnabled,
      notifySmsEnabled: schema.tenants.notifySmsEnabled,
    })
    .from(schema.domains)
    .innerJoin(schema.tenants, eq(schema.domains.tenantId, schema.tenants.id))
    .where(eq(schema.domains.hostname, host))
    .limit(1);

  const tenant = tenantRows[0];
  if (!tenant) {
    return NextResponse.json({ error: "unknown host" }, { status: 404 });
  }

  const lead = {
    source: "form" as const,
    name: (form.get("name") as string | null) ?? null,
    phone: (form.get("phone") as string | null) ?? null,
    email: (form.get("email") as string | null) ?? null,
    message: (form.get("message") as string | null) ?? null,
  };

  const [inserted] = await db
    .insert(schema.leads)
    .values({ tenantId: tenant.id, status: "new", ...lead })
    .returning({ id: schema.leads.id });

  // Alert the business, but never fail the public submission on a
  // notification problem.
  try {
    const outcomes = await notifyNewLead({
      business: tenant.businessName,
      lead,
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
          leadId: inserted?.id ?? null,
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
    console.error("[lead] notification dispatch failed", err);
  }

  return NextResponse.redirect(new URL("/?submitted=1", req.url), 303);
}
