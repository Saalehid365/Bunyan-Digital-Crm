import { z } from "zod";

export const onboardingTaskSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().trim().min(1, "Task title is required").max(200),
});
export type OnboardingTaskInput = z.infer<typeof onboardingTaskSchema>;
