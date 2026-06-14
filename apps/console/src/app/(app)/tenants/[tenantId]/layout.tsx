import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getTenant, newLeadCountsByTenant } from "@/lib/queries";
import { humanize } from "@/lib/format";
import TenantTabs from "@/components/TenantTabs";

export const dynamic = "force-dynamic";

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) notFound();

  const counts = await newLeadCountsByTenant([tenant.id]);
  const newLeads = counts[tenant.id] ?? 0;

  return (
    <>
      <div className="crumbs">
        <Link href="/">Dashboard</Link>
        <span className="sep">/</span>
        <span>{tenant.businessName}</span>
      </div>

      <div className="tenant-head">
        <div>
          <h1>{tenant.businessName}</h1>
          <div className="tenant-meta">
            <span>{humanize(tenant.niche)}</span>
            <span className="dot">-</span>
            <span>
              {tenant.city}, {tenant.state}
            </span>
            <span className="dot">-</span>
            <span className="mono small">{tenant.slug}</span>
          </div>
        </div>
        <span className={`badge status-${tenant.status}`}>{tenant.status}</span>
      </div>

      <TenantTabs tenantId={tenant.id} newLeads={newLeads} />

      {children}
    </>
  );
}
