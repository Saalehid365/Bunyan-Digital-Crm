import type { InvoiceStatus, JobStage, Priority, QuoteStatus, Recurrence } from "@prisma/client";

export type LinkedQuote = { id: string; number: number; status: QuoteStatus };
export type LinkedInvoice = { id: string; number: number; status: InvoiceStatus; paidAt: string | null };

export type JobTimeEntry = {
  id: string;
  minutes: number;
  note: string | null;
  workDate: string;
  userId: string | null;
  userName: string | null;
};

export type JobTask = {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
  totalMinutes: number;
  timeEntries: JobTimeEntry[];
};

export type KanbanJob = {
  id: string;
  title: string;
  description: string | null;
  stage: JobStage;
  position: number;
  priority: Priority;
  recurrence: Recurrence;
  dueDate: string | null;
  clientId: string;
  clientName: string;
  clientServiceId: string | null;
  serviceTypeName: string | null;
  serviceTypeColor: string | null;
  assignedTo: { id: string; name: string | null } | null;
  assignmentAckedAt: string | null;
  linkedQuote: LinkedQuote | null;
  linkedInvoice: LinkedInvoice | null;
  tasks: JobTask[];
};
