import { z } from "zod";

export const clientStatusEnum = z.enum(["LEAD", "ACTIVE", "PAUSED", "CHURNED"]);

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(120),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  status: clientStatusEnum.default("LEAD"),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;
