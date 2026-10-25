import { PRODUCT_CATEGORY_FIELDS, MAX_PRODUCT_PHOTOS, MAX_PRODUCT_VARIANTS, type ProductCategory } from "@/lib/product-categories";

export type ProductPhoto = { fileId?: string; url: string; fileName?: string };
export type ProductVariantInput = { label: string; price?: number; quantity?: number; sku?: string };

/** Reads this category's fields straight off formData (`attr_<key>`), trims, drops
 * empties. The field list comes from the same config the form was built from, so a
 * submission can't inject fields that don't belong to its category. */
export function readProductAttributes(formData: FormData, category: ProductCategory): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const field of PRODUCT_CATEGORY_FIELDS[category]) {
    const value = formData.get(`attr_${field.key}`);
    if (typeof value === "string" && value.trim()) attrs[field.key] = value.trim();
  }
  return attrs;
}

/** Parses the client-built `photos` JSON field, tolerating anything malformed by
 * dropping it rather than failing the whole submission over a photo. */
export function parseProductPhotos(raw: string | undefined): ProductPhoto[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p): p is ProductPhoto => p && typeof p === "object" && typeof p.url === "string")
      .slice(0, MAX_PRODUCT_PHOTOS);
  } catch {
    return [];
  }
}

/** Parses the client-built `variants` JSON field — same tolerant pattern as photos.
 * Drops any row without a label (nothing to call it) and coerces price/quantity, since
 * they arrive as whatever JSON.stringify produced client-side. */
export function parseProductVariants(raw: string | undefined): ProductVariantInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is Record<string, unknown> => v && typeof v === "object" && typeof v.label === "string" && v.label.trim())
      .slice(0, MAX_PRODUCT_VARIANTS)
      .map((v) => ({
        label: String(v.label).trim(),
        price: typeof v.price === "number" && Number.isFinite(v.price) ? v.price : undefined,
        quantity: typeof v.quantity === "number" && Number.isFinite(v.quantity) ? Math.trunc(v.quantity) : undefined,
        sku: typeof v.sku === "string" && v.sku.trim() ? v.sku.trim() : undefined,
      }));
  } catch {
    return [];
  }
}

/** Narrows a Prisma Json value (ClientProduct.attributes/photos) back to a plain object
 * or array, tolerating null/stale shapes by returning an empty fallback. */
export function toAttributesRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, string>;
}

export function toPhotosArray(value: unknown): ProductPhoto[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is ProductPhoto => p && typeof p === "object" && typeof p.url === "string");
}
