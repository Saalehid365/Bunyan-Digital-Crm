import { z } from "zod";

export const taskSchema = z.object({
  jobId: z.string().min(1),
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type TaskInput = z.infer<typeof taskSchema>;

export const taskDescriptionSchema = z.object({
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const timeEntrySchema = z.object({
  taskId: z.string().min(1),
  hours: z.coerce.number().min(0).max(24).default(0),
  minutes: z.coerce.number().min(0).max(59).default(0),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  workDate: z.string().trim().min(1, "Pick a date"),
});
export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
