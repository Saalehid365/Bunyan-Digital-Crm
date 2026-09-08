import { z } from "zod";

export const taskStageEnum = z.enum(["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const taskSchema = z.object({
  clientId: z.string().min(1),
  clientServiceId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  priority: priorityEnum.default("MEDIUM"),
  assignedToId: z.string().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
});
export type TaskInput = z.infer<typeof taskSchema>;

export const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  stage: taskStageEnum,
  position: z.number(),
});
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
