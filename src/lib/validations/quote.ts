import { z } from "zod";
import { lineItemsJsonSchema } from "./line-item";

export const quoteStatusEnum = z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]);

export const quoteSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(160),
  issueDate: z.string().trim().optional().or(z.literal("")),
  expiryDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  lineItemsJson: lineItemsJsonSchema,
});
export type QuoteInput = z.infer<typeof quoteSchema>;
