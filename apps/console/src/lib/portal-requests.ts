import "server-only";
import { db, schema } from "@platform/db";
import { and, desc, eq } from "drizzle-orm";
import type { ChangeRequestRow } from "./queries";

/**
 * Change-requests data layer for the CLIENT PORTAL (Surface C, B4 + B5).
 *
 * Reuses the existing change_requests table (no migration). The portal is the
 * place clients SUBMIT requests; the agency/operator stages a configDiff and
 * moves the request to preview_ready, and the client approves here. Every read
 * and write is scoped to ctx.tenant.id from requirePortal(); a request id from
 * the URL is always paired with the session tenant in the WHERE clause, so a
 * forged cross-tenant id resolves (and updates) nothing. RLS is defense-in-depth.
 *
 * The table has no kind/target-page columns, so a request's type and target
 * page are stored as a structured header line in `description`:
 *   "[<kind> | <page>]\n<free text>"
 * and parsed back out for display. A migration could promote these to real
 * columns later; until then this keeps the feature additive (code only).
 */

export type { ChangeRequestRow };
export type ChangeStatus = ChangeRequestRow["status"];

export const REQUEST_KINDS = [
  "Content edit",
  "Photo / image",
  "New page or section",
  "Business info / hours",
  "Something else",
] as const;

export const REQUEST_PAGES = [
  "Home",
  "About",
  "Services",
  "Contact",
  "Gallery",
  "Other / not sure",
] as const;

export const CHANGE_STATUS_LABELS: Record<ChangeStatus, string> = {
  queued: "Queued",
  in_progress: "In progress",
  preview_ready: "Preview ready",
  approved: "Approved",
  published: "Published",
};

/** Open = still being worked or awaiting the client; Done = finished. */
export const OPEN_CHANGE_STATUSES: readonly ChangeStatus[] = [
  "queued",
  "in_progress",
  "preview_ready",
];
export const DONE_CHANGE_STATUSES: readonly ChangeStatus[] = [
  "approved",
  "published",
];

export function isOpenStatus(s: ChangeStatus): boolean {
  return (OPEN_CHANGE_STATUSES as readonly string[]).includes(s);
}

export interface ParsedRequest {
  kind: string | null;
  page: string | null;
  body: string;
  title: string;
}

function titleFrom(body: string, fallback: string): string {
  const first = (body.split(/\r?\n/)[0] ?? "").trim();
  if (!first) return fallback;
  return first.length > 64 ? first.slice(0, 64) + "\u2026" : first;
}

/** Pull the structured "[kind | page]" header back out of a description. */
export function parseRequest(description: string): ParsedRequest {
  const m = description.match(
    /^\[([^\]|]+?)(?:\s\|\s([^\]]+?))?\]\r?\n?([\s\S]*)$/
  );
  if (m && m[1]) {
    const body = (m[3] ?? "").trim();
    return {
      kind: m[1].trim(),
      page: m[2] ? m[2].trim() : null,
      body,
      title: titleFrom(body, m[1].trim()),
    };
  }
  return {
    kind: null,
    page: null,
    body: description,
    title: titleFrom(description, "Request"),
  };
}

export function composeDescription(
  kind: string,
  page: string | null,
  body: string
): string {
  const head = page ? `[${kind} | ${page}]` : `[${kind}]`;
  return `${head}\n${body.trim()}`;
}

export async function listPortalRequests(
  tenantId: string
): Promise<ChangeRequestRow[]> {
  return db
    .select()
    .from(schema.changeRequests)
    .where(eq(schema.changeRequests.tenantId, tenantId))
    .orderBy(desc(schema.changeRequests.createdAt));
}

export async function getPortalRequest(
  tenantId: string,
  id: string
): Promise<ChangeRequestRow | null> {
  const rows = await db
    .select()
    .from(schema.changeRequests)
    .where(
      and(
        eq(schema.changeRequests.id, id),
        eq(schema.changeRequests.tenantId, tenantId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createPortalRequest(input: {
  tenantId: string;
  kind: string;
  page: string | null;
  body: string;
  requestedBy: string;
}): Promise<string | null> {
  const [row] = await db
    .insert(schema.changeRequests)
    .values({
      tenantId: input.tenantId,
      requestedBy: input.requestedBy,
      description: composeDescription(input.kind, input.page, input.body),
      // status defaults to "queued"
    })
    .returning({ id: schema.changeRequests.id });
  return row?.id ?? null;
}

/** Move a request to a new status (write scoped to id AND tenant). */
export async function setRequestStatus(
  tenantId: string,
  id: string,
  status: ChangeStatus
): Promise<void> {
  await db
    .update(schema.changeRequests)
    .set({ status })
    .where(
      and(
        eq(schema.changeRequests.id, id),
        eq(schema.changeRequests.tenantId, tenantId)
      )
    );
}
