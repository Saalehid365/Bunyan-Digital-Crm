import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";

export const portalUserSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
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

// A client's colour palette is a flexible 0–5 list, not fixed primary/secondary/accent
// roles — different clients want different numbers of brand colours.
export const brandColorsSchema = z.array(z.string().trim().max(20)).max(5, "Up to 5 colours").optional();

export const brandKitSchema = z.object({
  clientId: z.string().min(1),
  colors: brandColorsSchema,
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  // Submitted together with the rest of the brand kit so there's one save for the whole
  // form, not a separate add-a-logo step — see savePortalBrandKit/saveBrandKit.
  logoUrl: z.string().trim().max(600).optional().or(z.literal("")),
  logoFileId: z.string().trim().optional().or(z.literal("")),
});

/** The client's whole "Brand & access" page — one submit for the brand kit, logo, one
 * optional extra file, and one optional access login, instead of separate forms with
 * their own buttons. The "extra file" and "access" fields are each only acted on if
 * their own required field (fileLabel / accessLabel) was actually filled in. */
export const portalBrandPageSchema = z.object({
  clientId: z.string().min(1),
  colors: brandColorsSchema,
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  logoUrl: z.string().trim().max(600).optional().or(z.literal("")),
  logoFileId: z.string().trim().optional().or(z.literal("")),
  fileLabel: z.string().trim().max(120).optional().or(z.literal("")),
  fileUrl: z.string().trim().max(600).optional().or(z.literal("")),
  fileFileId: z.string().trim().optional().or(z.literal("")),
  fileKind: clientAssetKindEnum.default("BRAND_FILE"),
  accessLabel: z.string().trim().max(120).optional().or(z.literal("")),
  accessUsername: z.string().trim().max(200).optional().or(z.literal("")),
  accessSecret: z.string().trim().max(500).optional().or(z.literal("")),
  accessUrl: z.string().trim().max(500).optional().or(z.literal("")),
  accessNotes: z.string().trim().max(1000).optional().or(z.literal("")),
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

export const portalTeammateInviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
});

export const clientProductCategoryEnum = z.enum(PRODUCT_CATEGORIES);

export const clientProductSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(160),
  category: clientProductCategoryEnum.default("OTHER"),
  price: z.coerce.number().min(0).max(1_000_000).optional(),
  quantity: z.coerce.number().int().min(0).max(1_000_000).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  // A JSON-encoded array of { fileId?, url, fileName? }, built client-side — see
  // MAX_PRODUCT_PHOTOS in product-categories.ts for the cap.
  photos: z.string().trim().optional().or(z.literal("")),
  // A JSON-encoded array of { label, price?, quantity?, sku? } — same pattern as
  // photos, see MAX_PRODUCT_VARIANTS.
  variants: z.string().trim().optional().or(z.literal("")),
});
