/**
 * Lead status vocabulary, shared by the leads UI and the status-update
 * server action. Kept in its own module (not in queries.ts or actions.ts)
 * because "use server" files may only export async functions, and this is
 * also used by client/render code. Must stay in sync with the leadStatus
 * pgEnum in packages/db/src/schema.ts.
 */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

/** Open = still in the active pipeline (not yet won or lost). */
export const OPEN_LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "quoted",
];
