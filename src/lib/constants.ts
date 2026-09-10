import type {
  ClientStatus,
  InvoiceStatus,
  JobStage,
  Permission,
  Priority,
  QuoteStatus,
  Recurrence,
  ServiceStatus,
} from "@prisma/client";

export const PERMISSIONS: { value: Permission; label: string; description: string }[] = [
  { value: "MANAGE_CLIENTS", label: "Manage clients", description: "Create, edit, and delete their assigned clients" },
  { value: "VIEW_REPORTS", label: "View reports", description: "See revenue and time reports for their assigned clients" },
  { value: "MANAGE_SERVICES", label: "Manage services", description: "Edit the service catalog and price client services" },
  { value: "MANAGE_BILLING", label: "Manage billing", description: "Create and track quotes/invoices for their assigned clients" },
];

export const PERMISSION_LABEL: Record<Permission, string> = {
  MANAGE_CLIENTS: "Manage clients",
  VIEW_REPORTS: "View reports",
  MANAGE_SERVICES: "Manage services",
  MANAGE_BILLING: "Manage billing",
};

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

/** Same as GBP but keeps pence — dashboard summaries round to whole pounds, but an
 * actual quote/invoice line item or total needs the exact figure. */
export const GBP_PRECISE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export const QUOTE_STATUSES: { value: QuoteStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "EXPIRED", label: "Expired" },
];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "VOID", label: "Void" },
];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

/** Seeded onto a client's onboarding checklist the first time they become Active. */
export const DEFAULT_ONBOARDING_CHECKLIST: string[] = [
  "Send welcome email & confirm next steps",
  "Collect signed service agreement",
  "Add services & pricing on the client's Services tab",
  "Collect account access (eBay seller / website & hosting / ad accounts / socials — as applicable)",
  "Collect brand assets (logo, product images, brand guidelines)",
  "Schedule kickoff call",
  "Assign a team member to the account",
  "Create first job(s) for initial setup work",
  "Confirm billing details & send first invoice",
];

/** Formats a minute count as "2h 30m" / "45m" / "3h". */
export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
