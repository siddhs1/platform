"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

// Week 3 ships the Dashboard. Leads / Editor / Billing live under
// /tenants/[tenantId] and surface in the per-tenant sub-nav (later commits).
const ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "\u25E7" },
  { href: "/onboarding", label: "Onboard", icon: "\u2295" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-item is-active" : "nav-item"}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
