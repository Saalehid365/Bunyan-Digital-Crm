/**
 * What a client sees once they pick a product category — universal fields (name, price,
 * quantity, description, photos) apply everywhere and live as real columns on
 * ClientProduct; everything below is category-specific and stored in its `attributes`
 * JSON map, keyed by `key`. Add a category by adding one entry here — no migration
 * needed, since the fields it collects aren't real columns.
 */

export const PRODUCT_CATEGORIES = [
  "CLOTHING",
  "HEALTH_BEAUTY",
  "ELECTRONICS",
  "HOME_KITCHEN",
  "TOYS_GAMES",
  "OTHER",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  CLOTHING: "Clothing & accessories",
  HEALTH_BEAUTY: "Health & beauty",
  ELECTRONICS: "Electronics",
  HOME_KITCHEN: "Home & kitchen",
  TOYS_GAMES: "Toys & games",
  OTHER: "Other",
};

export type ProductField = {
  key: string;
  label: string;
  type: "text" | "select";
  options?: string[];
  placeholder?: string;
};

export const PRODUCT_CATEGORY_FIELDS: Record<ProductCategory, ProductField[]> = {
  CLOTHING: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "size", label: "Size", type: "text", placeholder: "e.g. M, UK 10, 32W" },
    { key: "colour", label: "Colour", type: "text" },
    { key: "material", label: "Material", type: "text" },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: ["New with tags", "New without tags", "Used — like new", "Used — good", "Used — fair"],
    },
  ],
  HEALTH_BEAUTY: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "size", label: "Size / volume", type: "text", placeholder: "e.g. 250ml, 100g" },
    { key: "expiryDate", label: "Expiry date", type: "text", placeholder: "MM/YYYY" },
    { key: "ingredients", label: "Key ingredients", type: "text" },
  ],
  ELECTRONICS: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Model", type: "text" },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: ["New", "Refurbished", "Used — working", "Used — for parts"],
    },
    { key: "warranty", label: "Warranty remaining", type: "text" },
  ],
  HOME_KITCHEN: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "dimensions", label: "Dimensions", type: "text", placeholder: "e.g. 30 x 20 x 10 cm" },
    { key: "material", label: "Material", type: "text" },
  ],
  TOYS_GAMES: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "ageRange", label: "Age range", type: "text", placeholder: "e.g. 3–5 years" },
    { key: "batteries", label: "Batteries required", type: "select", options: ["Yes", "No"] },
  ],
  OTHER: [],
};

export const MAX_PRODUCT_PHOTOS = 4;
export const MAX_PRODUCT_VARIANTS = 12;
