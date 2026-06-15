import "server-only";
import { db, schema } from "@platform/db";
import { asc, eq } from "drizzle-orm";
import { clerkEnabled } from "./clerk";
import type { TenantRow } from "./queries";

/**
 * Team membership data for the client portal (B14 account & team).
 *
 * The memberships table is the source of truth for a tenant's team + each
 * member's role (client_admin / client_staff). Inviting writes a row
 * (status "invited") and, when Clerk is configured and the tenant has an
 * org, best-effort sends a Clerk organization invitation so the teammate
 * gets an email and can sign in. Scoped to the caller's tenant id.
 */

export type MemberRow = typeof schema.memberships.$inferSelect;
export type ClientRole = "client_admin" | "client_staff";

export async function listMembers(tenantId: string): Promise<MemberRow[]> {
  return db
    .select()
    .from(schema.memberships)
    .where(eq(schema.memberships.tenantId, tenantId))
    .orderBy(asc(schema.memberships.createdAt));
}

export interface InviteResult {
  ok: boolean;
  clerkInvited: boolean;
}

export async function createInvite(
  tenant: TenantRow,
  email: string,
  role: ClientRole
): Promise<InviteResult> {
  // Membership row is the source of truth; upsert on (tenant, email) so a
  // re-invite just updates the role rather than failing the unique index.
  await db
    .insert(schema.memberships)
    .values({ tenantId: tenant.id, email, role, status: "invited" })
    .onConflictDoUpdate({
      target: [schema.memberships.tenantId, schema.memberships.email],
      set: { role },
    });

  let clerkInvited = false;
  if (clerkEnabled && tenant.clerkOrgId) {
    try {
      const mod = await import("@clerk/nextjs/server");
      const client = await mod.clerkClient();
      // Cast to a minimal shape so we do not couple to the exact Clerk SDK
      // types (which drift across versions); the call is best-effort.
      await (
        client.organizations as unknown as {
          createOrganizationInvitation: (p: {
            organizationId: string;
            emailAddress: string;
            role: string;
          }) => Promise<unknown>;
        }
      ).createOrganizationInvitation({
        organizationId: tenant.clerkOrgId,
        emailAddress: email,
        role: "org:member",
      });
      clerkInvited = true;
    } catch {
      // Membership row already written; the email invite can be retried or
      // sent from the Clerk dashboard. Never fail the invite on this.
      clerkInvited = false;
    }
  }
  return { ok: true, clerkInvited };
}
