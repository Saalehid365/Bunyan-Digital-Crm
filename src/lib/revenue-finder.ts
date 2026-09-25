import type { RevenueFinderStatus } from "@prisma/client";

export const REVENUE_FINDER_STATUSES: RevenueFinderStatus[] = [
  "NEW",
  "QUALIFIED",
  "NOT_QUALIFIED",
  "ACCESS_GRANTED",
  "SPRINT_RUNNING",
  "REVEAL_BOOKED",
  "COMPLETED",
  "CONVERTED",
];

export const REVENUE_FINDER_STATUS_LABEL: Record<RevenueFinderStatus, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  NOT_QUALIFIED: "Not qualified",
  ACCESS_GRANTED: "Access granted",
  SPRINT_RUNNING: "Sprint running",
  REVEAL_BOOKED: "Reveal booked",
  COMPLETED: "Completed",
  CONVERTED: "Converted",
};

export const REVENUE_FINDER_STATUS_FILL: Record<RevenueFinderStatus, string> = {
  NEW: "bg-primary/15 text-primary",
  QUALIFIED: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  NOT_QUALIFIED: "bg-muted text-muted-foreground",
  ACCESS_GRANTED: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  SPRINT_RUNNING: "bg-[var(--chart-3)]/15 text-[var(--chart-3)]",
  REVEAL_BOOKED: "bg-[var(--chart-3)]/15 text-[var(--chart-3)]",
  COMPLETED: "bg-success/15 text-success",
  CONVERTED: "bg-success/15 text-success",
};

/** Store URLs are user-typed: only ever link out to http(s), never javascript: etc. */
export function safeStoreHref(raw: string): string | null {
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(candidate);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
