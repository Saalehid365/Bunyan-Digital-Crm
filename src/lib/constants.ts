import type { ClientStatus, Priority, ServiceStatus, TaskStage } from "@prisma/client";

export const TASK_STAGES: { value: TaskStage; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "DONE", label: "Done" },
];

export const TASK_STAGE_LABEL: Record<TaskStage, string> = {
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
