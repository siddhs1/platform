"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getTenant } from "@/lib/queries";
import {
  hostnameExists,
  createDomainRow,
  getDomain,
  setDomainSsl,
} from "@/lib/domains";
import { createCustomHostname, getCustomHostnameStatus } from "@/lib/cloudflare";

/**
 * C2 domain provisioning actions (operator). Authorization via getTenant
 * (canAccessTenant); writes are scoped to the tenant.
 */
function domainsPath(tenantId: string): string {
  return `/tenants/${tenantId}/domains`;
}
function err(tenantId: string, msg: string): never {
  redirect(`${domainsPath(tenantId)}?err=${encodeURIComponent(msg)}`);
}

function normalizeHost(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export async function addDomain(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return;
  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) return;

  const hostname = normalizeHost(String(formData.get("hostname") ?? ""));
  if (!hostname || !hostname.includes(".")) {
    err(tenantId, "Enter a valid hostname");
  }
  if (await hostnameExists(hostname)) {
    err(tenantId, "That hostname is already in use");
  }

  const isLocal = hostname.includes("localhost");
  const cf = isLocal
    ? { id: null, ssl: "active" as const }
    : await createCustomHostname(hostname);

  await createDomainRow({
    tenantId,
    hostname,
    cfHostnameId: cf.id,
    sslStatus: isLocal ? "active" : cf.ssl,
    isPrimary: false,
  }).catch((): never => err(tenantId, "Could not add that hostname"));

  redirect(`${domainsPath(tenantId)}?added=1`);
}

export async function refreshDomain(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const id = String(formData.get("domainId") ?? "");
  if (!tenantId || !id) return;
  const session = await requireSession();
  const tenant = await getTenant(session, tenantId);
  if (!tenant) return;

  const d = await getDomain(tenantId, id);
  if (d?.cfHostnameId) {
    const ssl = await getCustomHostnameStatus(d.cfHostnameId);
    await setDomainSsl(tenantId, id, ssl);
  }
  redirect(`${domainsPath(tenantId)}?refreshed=1`);
}
