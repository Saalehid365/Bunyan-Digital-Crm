import { z } from "zod";

/** Shared shape for Quote and Invoice line items. */
export const lineItemSchema = z.object({
  clientServiceId: z.string().trim().min(1).optional().or(z.literal("")),
  description: z.string().trim().min(1, "Description is required").max(200),
  quantity: z
    .union([z.string(), z.number()])
    .transform((v) => {
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(n) && n > 0 ? n : 1;
    }),
  unitPrice: z
    .union([z.string(), z.number()])
    .transform((v) => {
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }),
});
export type LineItemInput = z.infer<typeof lineItemSchema>;

/**
 * Line items are a repeating, dynamically-added/removed array — unlike every other
 * form in this app, they can't be read directly off individual FormData fields. The
 * dialog serializes them into one hidden `lineItemsJson` input; this parses + validates
 * that JSON string in one step.
 */
export const lineItemsJsonSchema = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid line items" });
      return z.NEVER;
    }
  })
  .pipe(z.array(lineItemSchema).min(1, "Add at least one line item"));
