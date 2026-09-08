import type { Priority, TaskStage } from "@prisma/client";

export type KanbanTask = {
  id: string;
  title: string;
  description: string | null;
  stage: TaskStage;
  position: number;
  priority: Priority;
  dueDate: string | null;
  clientId: string;
  clientName: string;
  clientServiceId: string | null;
  serviceTypeName: string | null;
  serviceTypeColor: string | null;
  assignedTo: { id: string; name: string | null } | null;
};
