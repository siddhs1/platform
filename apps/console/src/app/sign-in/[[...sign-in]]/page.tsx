import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import "../../globals.css";
import { clerkEnabled, devNoAuth } from "@/lib/clerk";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (!clerkEnabled) {
    // Dev bypass: no Clerk, but explicitly opted into no-auth - go straight in.
    if (devNoAuth) redirect("/");

    // No keys and no bypass: explain how to enable access.
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="brand-mark big" aria-hidden="true">
            {"\u25A6"}
          </span>
          <h1>Authentication not configured</h1>
          <p className="muted">
            Clerk keys aren&apos;t set for this environment. Add
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable
            sign-in.
          </p>
          <p className="muted small">
            For local development, set CONSOLE_DEV_NO_AUTH=1 to bypass auth.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <SignIn />
    </div>
  );
}
