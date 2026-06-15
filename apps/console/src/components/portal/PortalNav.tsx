"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Client portal navigation. Items not yet built render as dimmed, non-link
// "soon" entries so the shell shows the full product shape without 404s;
// later commits flip `enabled` to true as each screen lands (B2 leads,
// B4/B5 requests, B6 billing, B12 site, B13/B14 settings, Phase 2 reviews).
interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  enabled: boolean;
  exact?: boolean;
  badge?: boolean;
  mobile?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: "home", enabled: true, exact: true, mobile: true },
  { href: "/portal/leads", label: "Leads", icon: "inbox", enabled: true, badge: true, mobile: true },
  { href: "/portal/requests", label: "Requests", icon: "chat", enabled: true, mobile: true },
  { href: "/portal/reviews", label: "Reviews", icon: "star", enabled: false, mobile: true },
  { href: "/portal/billing", label: "Billing", icon: "card", enabled: false },
  { href: "/portal/site", label: "Your Site", icon: "globe", enabled: false },
  { href: "/portal/settings", label: "Settings", icon: "gear", enabled: false, mobile: true },
];

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");
}

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return <span className="p-nav-badge">{n}</span>;
}

export function PortalSidebarNav({ newLeads = 0 }: { newLeads?: number }) {
  const isActive = useIsActive();
  return (
    <nav className="p-nav" aria-label="Primary">
      {ITEMS.map((item) => {
        const content = (
          <>
            <span className="p-nav-ico" aria-hidden="true">
              <Icon name={item.icon} />
            </span>
            <span className="p-nav-label">{item.label}</span>
            {item.enabled && item.badge ? <Badge n={newLeads} /> : null}
            {!item.enabled ? <span className="p-soon">soon</span> : null}
          </>
        );
        if (!item.enabled) {
          return (
            <span key={item.href} className="p-nav-item is-disabled" aria-disabled="true">
              {content}
            </span>
          );
        }
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "p-nav-item is-active" : "p-nav-item"}
            aria-current={active ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalTabBar({ newLeads = 0 }: { newLeads?: number }) {
  const isActive = useIsActive();
  const tabs = ITEMS.filter((i) => i.mobile);
  return (
    <nav className="p-tabbar" aria-label="Primary">
      {tabs.map((item) => {
        const inner = (
          <>
            <span className="p-tab-ico" aria-hidden="true">
              <Icon name={item.icon} />
            </span>
            <span className="p-tab-label">{item.label}</span>
            {item.enabled && item.badge && newLeads > 0 ? (
              <span className="p-tab-dot" aria-hidden="true" />
            ) : null}
          </>
        );
        if (!item.enabled) {
          return (
            <span key={item.href} className="p-tab is-disabled" aria-disabled="true">
              {inner}
            </span>
          );
        }
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "p-tab is-active" : "p-tab"}
            aria-current={active ? "page" : undefined}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}

// -- inline icon set (24x24, stroke = currentColor) --
type IconName =
  | "home"
  | "inbox"
  | "chat"
  | "star"
  | "card"
  | "globe"
  | "gear"
  | "bell";

const PATHS: Record<IconName, ReactNode> = {
  home: <path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" />,
  inbox: <path d="M4 13h4l1.5 2.5h5L16 13h4M4 13l2.5-7h11L20 13v6H4z" />,
  chat: <path d="M5 5h14v10H9l-4 4z" />,
  star: <path d="m12 4 2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z" />,
  card: <path d="M3 7h18v10H3zM3 10h18" />,
  globe: <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM4 12h16M12 4c2.5 2 2.5 14 0 16M12 4c-2.5 2-2.5 14 0 16" />,
  gear: <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />,
  bell: <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0" />,
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
