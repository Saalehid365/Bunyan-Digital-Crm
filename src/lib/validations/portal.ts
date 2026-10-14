import { z } from "zod";

export const portalUserSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export const clientResultSchema = z.object({
  clientId: z.string().min(1),
  period: z.string().trim().min(1, "Period is required").max(60),
  label: z.string().trim().min(1, "Label is required").max(80),
  value: z.string().trim().min(1, "Value is required").max(40),
  change: z.string().trim().max(40).optional().or(z.literal("")),
});

export const clientCampaignStatusEnum = z.enum(["ACTIVE", "PAUSED", "COMPLETED"]);

export const clientCampaignSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(160),
  platform: z.string().trim().min(1, "Platform is required").max(80),
  status: clientCampaignStatusEnum.default("ACTIVE"),
  startDate: z.string().trim().optional().or(z.literal("")),
  endDate: z.string().trim().optional().or(z.literal("")),
  spend: z.coerce.number().min(0).max(10_000_000).optional(),
  revenue: z.coerce.number().min(0).max(10_000_000).optional(),
  roas: z.coerce.number().min(0).max(9999).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const clientReportSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(160),
  period: z.string().trim().max(60).optional().or(z.literal("")),
  url: z.string().trim().min(1, "Link is required").max(600),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const clientAssetKindEnum = z.enum(["LOGO", "BRAND_FILE", "PRODUCT_PHOTO", "OTHER"]);

export const clientAssetSchema = z.object({
  clientId: z.string().min(1),
  kind: clientAssetKindEnum.default("OTHER"),
  label: z.string().trim().min(1, "Label is required").max(120),
  url: z.string().trim().min(1, "Link is required").max(600),
  fileId: z.string().trim().optional().or(z.literal("")),
});

export const brandKitSchema = z.object({
  clientId: z.string().min(1),
  primaryColor: z.string().trim().max(20).optional().or(z.literal("")),
  secondaryColor: z.string().trim().max(20).optional().or(z.literal("")),
  accentColor: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const clientMessageSchema = z.object({
  clientId: z.string().min(1),
  body: z.string().trim().min(1, "Message can't be empty").max(4000),
});

export const clientDocumentKindEnum = z.enum(["AGREEMENT", "QUESTIONNAIRE", "FORM", "OTHER"]);

export const clientDocumentSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(160),
  kind: clientDocumentKindEnum.default("OTHER"),
  url: z.string().trim().min(1, "Link is required").max(600),
  fileId: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
});
