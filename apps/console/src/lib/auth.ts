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
 * Role model (Week 3, evolving): every authenticated console user is an
 * operator (owner) for now. Once onboarding gives each client tenant its
 * own Clerk org, a user whose active org is a client org will be mapped to
 * "client" (scoped to that one tenant), and owner/staff will be split by
 * role within a dedicated agency ops org. Client scoping is already
 * enforced per-tenant in queries via canAccessTenant().
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
      role: roleFromClerk(),
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

function roleFromClerk(): Role {
  // TODO(onboarding): once the Clerk org structure is finalized, take the
  // active org id + org role and map client-org users to "client" (scoped
  // to their one tenant), splitting owner/staff inside the agency ops org.
  // Until then, every signed-in console user is treated as the owner.
  return "owner";
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export { isOperator };
export type { Role };
