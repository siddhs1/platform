import type { ReactNode } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { PortalSidebarNav, PortalTabBar, Icon } from "./PortalNav";
import { clerkEnabled } from "@/lib/clerk";
import type { PortalContext } from "@/lib/portal";

function initials(name: string | null, email: string | null): string {
  const base = (name || email || "You").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Operator",
  staff: "Team",
  client_admin: "Owner",
  client_staff: "Staff",
};

export default function PortalShell({
  ctx,
  newLeads,
  children,
}: {
  ctx: PortalContext;
  newLeads: number;
  children: ReactNode;
}) {
  const who = ctx.name || ctx.email || "You";
  return (
    <div className="p-shell">
      <aside className="p-side">
        <div className="p-brand">
          <span className="p-brand-mark" aria-hidden="true" />
          <span className="p-brand-text">
            <strong>{ctx.tenant.businessName}</strong>
            <small>Client console</small>
          </span>
        </div>

        <PortalSidebarNav newLeads={newLeads} />

        <div className="p-side-foot">
          <div className="p-user">
            <span className="p-avatar" aria-hidden="true">
              {initials(ctx.name, ctx.email)}
            </span>
            <span className="p-user-meta">
              <span className="p-user-name">{who}</span>
              <span className="p-user-sub">{ROLE_LABELS[ctx.role] ?? ctx.role}</span>
            </span>
          </div>
          {clerkEnabled ? (
            <SignOutButton>
              <button className="p-signout" type="button">
                Sign out
              </button>
            </SignOutButton>
          ) : null}
        </div>
      </aside>

      <div className="p-main">
        <header className="p-topbar">
          <div className="p-topbar-ctx">
            <span className="p-topbar-name">{ctx.tenant.businessName}</span>
          </div>
          <div className="p-topbar-actions">
            <button
              className="p-iconbtn"
              type="button"
              disabled
              aria-label="Notifications (coming soon)"
              title="Notifications (coming soon)"
            >
              <Icon name="bell" />
            </button>
            <span className="p-avatar sm" aria-hidden="true">
              {initials(ctx.name, ctx.email)}
            </span>
          </div>
        </header>

        <main className="p-content">{children}</main>
      </div>

      <PortalTabBar newLeads={newLeads} />
    </div>
  );
}
