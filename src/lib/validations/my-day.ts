import { z } from "zod";

export const personalTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
});
export type PersonalTaskInput = z.infer<typeof personalTaskSchema>;

export const followUpSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string({ error: "Pick a follow-up date" }).trim().min(1, "Pick a follow-up date"),
  clientId: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});
export type FollowUpInput = z.infer<typeof followUpSchema>;
