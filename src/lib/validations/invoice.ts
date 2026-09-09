import { z } from "zod";
import { lineItemsJsonSchema } from "./line-item";

export const invoiceStatusEnum = z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"]);

export const invoiceSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(160),
  issueDate: z.string().trim().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  lineItemsJson: lineItemsJsonSchema,
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;
