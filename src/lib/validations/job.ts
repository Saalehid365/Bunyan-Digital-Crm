import { z } from "zod";

export const jobStageEnum = z.enum(["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const recurrenceEnum = z.enum(["NONE", "DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"]);

export const jobSchema = z.object({
  clientId: z.string().min(1),
  clientServiceId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  priority: priorityEnum.default("MEDIUM"),
  recurrence: recurrenceEnum.default("NONE"),
  assignedToId: z.string().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
});
export type JobInput = z.infer<typeof jobSchema>;

export const moveJobSchema = z.object({
  jobId: z.string().min(1),
  stage: jobStageEnum,
  position: z.number(),
});
export type MoveJobInput = z.infer<typeof moveJobSchema>;
