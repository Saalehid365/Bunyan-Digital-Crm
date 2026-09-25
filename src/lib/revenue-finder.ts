import type { RevenueFinderStatus } from "@prisma/client";

/** Service type auto-created on the first conversion; the converted client gets this service and a job. */
export const REVENUE_FINDER_SERVICE_NAME = "7-Day Revenue Finder";

/** The nine stages of the sprint workflow (Bunyan 7-Day Revenue Finder Sprint Workflow, page 2) — become the job's tasks. */
export const REVENUE_FINDER_SPRINT_TASKS: { title: string; description: string }[] = [
  { title: "Stage 0 — Qualify & onboard (before clock · 15 min)", description: "Spot confirmed · access guide + Numbers Form sent · Reveal Call booked" },
  { title: "Stage 1 — Baseline (Day 1 · 20 min)", description: "Store's key numbers recorded in the tracker" },
  { title: "Stage 2 — Outside-in teardown (Day 1–2 · 40 min)", description: "Walk the store as a customer · 12-lever checklist marked · screenshots saved" },
  { title: "Stage 3 — Access check (Day 2 · 5 min)", description: "Every login works, or a reminder is sent" },
  { title: "Stage 4 — Data dive (Day 2–3 · 40 min)", description: "5 data points recorded · opportunities confirmed or dropped" },
  { title: "Stage 5 — Size, rank & quick win (Day 3–4 · 40 min)", description: "Top 3–5 ranked with £/SAR ranges · one quick win live" },
  { title: "Stage 6 — Scorecard & video (Day 4–5 · 35 min)", description: "Scorecard PDF + walkthrough video sent to the client" },
  { title: "Stage 7 — Reveal Call (Day 5–7 · 35 min)", description: "30-min call · option agreed or follow-up booked" },
  { title: "Stage 8 — Proposal & follow-up (same day · 10 min)", description: "Proposal sent · follow-ups scheduled · tracker updated" },
];

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
