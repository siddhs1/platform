import "server-only";

/**
 * Cloudflare for SaaS custom-hostname provisioning.
 *
 * Mirrors the lazy/degrade pattern of the Stripe + Clerk wiring: nothing
 * connects at import time and the whole surface is optional. When the API
 * token + zone are not configured, `cloudflareEnabled` is false and callers
 * fall back to manual DNS instructions + a "pending" status, so onboarding
 * and the domains UI work without Cloudflare keys.
 *
 * Custom hostnames let each client point their own domain at the single
 * multi-tenant sites app; Cloudflare terminates SSL and forwards to the
 * fallback origin. We store the returned hostname id + SSL status on the
 * domains row (cf_hostname_id, ssl_status).
 */

export const cloudflareEnabled = !!(
  process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID
);

const API = "https://api.cloudflare.com/client/v4";

export type SslStatus = "pending" | "active" | "failed";

/** The CNAME target a client points their domain at (the SaaS fallback
 *  origin / Cloudflare proxy). Shown in the DNS instructions. */
export function dnsTarget(): string {
  return process.env.CLOUDFLARE_CNAME_TARGET ?? "ssl.yourplatform.example";
}

/** Map a Cloudflare SSL status string onto our 3-state enum. */
export function mapSslStatus(cf: string | null | undefined): SslStatus {
  const s = (cf ?? "").toLowerCase();
  if (s === "active") return "active";
  if (s.includes("fail") || s.includes("error") || s === "deleted") return "failed";
  return "pending";
}

export interface CustomHostnameResult {
  id: string | null;
  ssl: SslStatus;
}

/** Create a Cloudflare custom hostname. Returns a pending placeholder when
 *  Cloudflare is not configured (manual DNS path). Never throws. */
export async function createCustomHostname(
  hostname: string
): Promise<CustomHostnameResult> {
  if (!cloudflareEnabled) return { id: null, ssl: "pending" };
  try {
    const res = await fetch(
      `${API}/zones/${process.env.CLOUDFLARE_ZONE_ID}/custom_hostnames`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostname,
          ssl: { method: "http", type: "dv" },
        }),
      }
    );
    const json = (await res.json()) as {
      result?: { id?: string; ssl?: { status?: string } };
    };
    return {
      id: json.result?.id ?? null,
      ssl: mapSslStatus(json.result?.ssl?.status),
    };
  } catch {
    return { id: null, ssl: "pending" };
  }
}

/** Re-read a custom hostname's SSL status from Cloudflare. Never throws. */
export async function getCustomHostnameStatus(
  cfHostnameId: string
): Promise<SslStatus> {
  if (!cloudflareEnabled || !cfHostnameId) return "pending";
  try {
    const res = await fetch(
      `${API}/zones/${process.env.CLOUDFLARE_ZONE_ID}/custom_hostnames/${cfHostnameId}`,
      { headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` } }
    );
    const json = (await res.json()) as {
      result?: { ssl?: { status?: string } };
    };
    return mapSslStatus(json.result?.ssl?.status);
  } catch {
    return "pending";
  }
}
