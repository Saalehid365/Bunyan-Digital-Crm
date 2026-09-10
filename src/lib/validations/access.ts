import { z } from "zod";

export const clientAccessSchema = z.object({
  clientId: z.string().min(1),
  label: z.string().trim().min(1, "Label is required").max(120),
  username: z.string().trim().max(200).optional().or(z.literal("")),
  secret: z.string().trim().max(500).optional().or(z.literal("")),
  url: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type ClientAccessInput = z.infer<typeof clientAccessSchema>;
