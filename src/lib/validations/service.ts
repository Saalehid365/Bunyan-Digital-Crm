import { z } from "zod";

export const serviceTypeSchema = z.object({
  name: z.string().trim().min(1, "Service name is required").max(80),
  colorHex: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #E08245")
    .default("#E08245"),
});
export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;

export const clientServiceStatusEnum = z.enum(["ACTIVE", "PAUSED", "COMPLETED"]);
export const billingTypeEnum = z.enum(["MONTHLY", "ONE_OFF"]);

export const clientServiceSchema = z.object({
  clientId: z.string().min(1),
  serviceTypeId: z.string().min(1, "Choose a service"),
  label: z.string().trim().max(120).optional().or(z.literal("")),
  status: clientServiceStatusEnum.default("ACTIVE"),
  billingType: billingTypeEnum.default("MONTHLY"),
  priceValue: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(n) ? n : undefined;
    }),
  startDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  createInitialInvoice: z.union([z.literal("on"), z.literal("true")]).optional(),
  invoiceDueDate: z.string().trim().optional().or(z.literal("")),
});
export type ClientServiceInput = z.infer<typeof clientServiceSchema>;
