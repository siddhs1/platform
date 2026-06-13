import type { ReactNode } from "react";
import { SignOutButton } from "@clerk/nextjs";
import NavLinks from "./NavLinks";
import { clerkEnabled } from "@/lib/clerk";
import type { Session } from "@/lib/auth";

function initials(session: Session): string {
  const base = (session.name || session.email || "User").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0] ?? "";
    const b = parts[1] ?? "";
    return (a.charAt(0) + b.charAt(0)).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

export default function Shell({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            {"\u25A6"}
          </span>
          <span className="brand-text">
            <strong>Platform</strong>
            <small>Operator Console</small>
          </span>
        </div>

        <NavLinks />

        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">
              {initials(session)}
            </span>
            <span className="user-meta">
              <span className="user-name">
                {session.name || session.email || "Operator"}
              </span>
              <span className="user-sub">{session.role}</span>
            </span>
          </div>

          {clerkEnabled ? (
            <SignOutButton>
              <button className="signout" type="button">
                Sign out
              </button>
            </SignOutButton>
          ) : null}

          <div className="build-tag">v0.1 · wk3</div>
        </div>
      </aside>

      <div className="main">
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
