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
  // Optional "set up the client's portal login now" fields — only present on create,
  // and only meaningful together with createPortalLogin checked (see addClientService's
  // identical createInitialInvoice pattern for why these need `?? undefined` wherever
  // they're read from a conditionally-rendered form field).
  createPortalLogin: z.union([z.literal("on"), z.literal("true")]).optional(),
  portalEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  portalPassword: z.string().optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;
