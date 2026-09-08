import type { ClientStatus, JobStage, Priority, Recurrence, ServiceStatus } from "@prisma/client";

export const JOB_STAGES: { value: JobStage; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "DONE", label: "Done" },
];

export const JOB_STAGE_LABEL: Record<JobStage, string> = {
  BACKLOG: "Backlog",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const RECURRENCE_TABS: { value: Recurrence | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "MONTHLY", label: "Monthly" },
];

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  NONE: "One-off",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  MONTHLY: "Monthly",
};

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  LEAD: "Lead",
  ACTIVE: "Active",
  PAUSED: "Paused",
  CHURNED: "Churned",
};

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

/** Formats a minute count as "2h 30m" / "45m" / "3h". */
export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
