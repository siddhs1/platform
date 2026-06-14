import type { ReactNode } from "react";
import "./portal.css";
import { requirePortal } from "@/lib/portal";
import { newLeadCount } from "@/lib/portal-queries";
import PortalShell from "@/components/portal/PortalShell";

// The client portal (Surface C). Lives outside the operator (app) route
// group, so it inherits only the root layout (html/body/fonts/Clerk) and its
// own portal.css - never the operator Shell or globals.css. Hits the DB +
// auth on every request.
export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await requirePortal();
  const newLeads = await newLeadCount(ctx.tenant.id);
  return (
    <PortalShell ctx={ctx} newLeads={newLeads}>
      {children}
    </PortalShell>
  );
}
