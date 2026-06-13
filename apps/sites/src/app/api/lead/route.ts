/**
 * Public lead intake. The contact-form block posts here. Resolves the
 * tenant from the request hostname, writes a lead, and (later) fires an
 * Inngest event for SMS notification. Kept minimal for Week 1; hardening
 * (rate-limit, spam check, Twilio notify) lands in Week 3 with the
 * console.
 */
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@platform/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").replace(/^www\./, "");
  const form = await req.formData();

  const domainRow = await db
    .select({ tenantId: schema.domains.tenantId })
    .from(schema.domains)
    .where(eq(schema.domains.hostname, host))
    .limit(1);

  const tenantId = domainRow[0]?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "unknown host" }, { status: 404 });
  }

  await db.insert(schema.leads).values({
    tenantId,
    source: "form",
    name: (form.get("name") as string) ?? null,
    phone: (form.get("phone") as string) ?? null,
    email: (form.get("email") as string) ?? null,
    message: (form.get("message") as string) ?? null,
    status: "new",
  });

  // TODO Week 3: await inngest.send({ name: "lead/created", data: { tenantId }})
  return NextResponse.redirect(new URL("/?submitted=1", req.url), 303);
}
