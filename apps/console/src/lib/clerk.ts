/**
 * Auth-mode flags. Clerk is the production auth provider; when its keys
 * are absent the console can run in an explicit, dev-only no-auth mode so
 * the operator surface is usable before Clerk is configured. This mirrors
 * the degrade-without-secrets pattern used by the db client: the app must
 * build and boot without external credentials.
 *
 * This module only reads process.env, so it is safe to import from both
 * server and client components and from edge middleware.
 */
export const clerkEnabled =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0;

/**
 * Dev bypass: only honored OUTSIDE production AND only when explicitly
 * opted in via CONSOLE_DEV_NO_AUTH=1. Never lets an unauthenticated
 * session through in production.
 */
export const devNoAuth =
  process.env.NODE_ENV !== "production" &&
  process.env.CONSOLE_DEV_NO_AUTH === "1";

export type Role = "owner" | "staff" | "client";

/** owner + staff (VAs) are operators with cross-tenant access. */
export function isOperator(role: Role): boolean {
  return role === "owner" || role === "staff";
}
