import type { JobStage, Priority, Recurrence } from "@prisma/client";

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
  tasks: JobTask[];
};
