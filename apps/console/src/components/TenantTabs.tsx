"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

interface Tab {
  /** Child route segment this tab maps to; null = the index (Overview). */
  segment: string | null;
  label: string;
  href: string;
  count?: number;
}

export default function TenantTabs({
  tenantId,
  newLeads,
}: {
  tenantId: string;
  newLeads: number;
}) {
  const active = useSelectedLayoutSegment();
  const base = `/tenants/${tenantId}`;

  const tabs: Tab[] = [
    { segment: null, label: "Overview", href: base },
    { segment: "leads", label: "Leads", href: `${base}/leads`, count: newLeads },
    { segment: "editor", label: "Editor", href: `${base}/editor` },
    { segment: "billing", label: "Billing", href: `${base}/billing` },
    { segment: "domains", label: "Domains", href: `${base}/domains` },
  ];

  return (
    <nav className="subnav">
      {tabs.map((tab) => {
        const isActive = active === tab.segment;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={isActive ? "is-active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
            {typeof tab.count === "number" && tab.count > 0 ? (
              <span className="tab-count">{tab.count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
