import "server-only";
import { redirect } from "next/navigation";
import { clerkEnabled, devNoAuth, isOperator, type Role } from "./clerk";

export interface Session {
  userId: string;
  email: string | null;
  name: string | null;
  role: Role;
  /** Clerk organization id of the active org; maps to tenants.clerk_org_id. */
  orgId: string | null;
}

/**
 * Resolve the current session, or null when unauthenticated.
 *
 * Role model: operators (the agency team) are marked by publicMetadata.role =
 * "owner" | "staff" on their Clerk user (set via the Clerk Backend API /
 * dashboard, never self-service). Any other authenticated user is a client and
 * is routed to /portal by requireSession(); their per-tenant role lives in the
 * memberships table (see lib/portal.ts). Per-tenant access is also enforced in
 * the data layer via canAccessTenant().
 */
export async function getSession(): Promise<Session | null> {
  if (clerkEnabled) {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const a = await auth();
    if (!a.userId) return null;
    const user = await currentUser().catch(() => null);
    const name =
      user && (user.firstName || user.lastName)
        ? [user.firstName, user.lastName].filter(Boolean).join(" ")
        : null;
    return {
      userId: a.userId,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      name,
      role: operatorRoleFromUser(user),
      orgId: a.orgId ?? null,
    };
  }

  if (devNoAuth) {
    return {
      userId: "dev-owner",
      email: "owner@dev.local",
      name: "Dev Owner",
      role: "owner",
      orgId: null,
    };
  }

  return null;
}

/**
 * Operator role from the Clerk user's publicMetadata. Only "owner"/"staff"
 * are operators; anything else is a client, for which we return a non-operator
 * sentinel ("client_admin") so isOperator() is false and requireSession()
 * routes them to /portal. The real client role is resolved per-tenant from the
 * memberships table in lib/portal.ts, never here.
 */
function operatorRoleFromUser(
  user: { publicMetadata?: unknown } | null
): Role {
  const meta = (user?.publicMetadata ?? {}) as { role?: unknown };
  const r = meta.role;
  if (r === "owner" || r === "staff") return r;
  return "client_admin";
}

/**
 * Gate an operator-console page or action. Unauthenticated visitors go to
 * /sign-in; authenticated non-operators (clients) are routed to /portal so the
 * operator console is never shown to a client. The (app) route group layout
 * calls this, so the whole operator surface is protected in one place.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!isOperator(session.role)) redirect("/portal");
  return session;
}

export { isOperator };
export type { Role };
