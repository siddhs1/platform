import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { getSession } from "@/lib/auth";
import { getPortalContext } from "@/lib/portal";
import { clerkEnabled, isOperator } from "@/lib/clerk";

// Single place that decides where a freshly authenticated user lands:
// operators -> / (operator console), clients -> /portal. Clerk's
// SIGN_IN_FORCE_REDIRECT_URL points here. It never redirects in a loop: a
// signed-in user who is neither an operator nor a member of any tenant gets a
// terminal "pending setup" page instead of being bounced back to /sign-in.
export const dynamic = "force-dynamic";

export default async function PostAuthPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (isOperator(session.role)) redirect("/");
  const ctx = await getPortalContext();
  if (ctx) redirect("/portal");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f7fa",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "460px",
          background: "#ffffff",
          border: "1px solid #e7ebf0",
          borderRadius: "14px",
          padding: "32px",
          textAlign: "center",
          boxShadow: "0 6px 22px rgba(19,24,32,0.07)",
        }}
      >
        <h1 style={{ fontSize: "20px", margin: "0 0 10px", color: "#131820" }}>
          Account pending setup
        </h1>
        <p style={{ color: "#5a6472", margin: "0 0 20px", lineHeight: 1.55 }}>
          You are signed in, but your account is not linked to a workspace yet.
          An administrator needs to add you to one. Once that is done, sign in
          again to reach your console.
        </p>
        {clerkEnabled ? (
          <SignOutButton>
            <button
              type="button"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                padding: "9px 16px",
                borderRadius: "9px",
                border: "1px solid #d6dce4",
                background: "#ffffff",
                color: "#131820",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </SignOutButton>
        ) : (
          <Link href="/sign-in" style={{ color: "#1d4ed8", fontWeight: 600 }}>
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
