/** Prisma's Json type isn't statically typed — this narrows a ClientBrandKit.colors
 * value (stored as a JSON array of hex strings) back to a plain string[], tolerating
 * anything unexpected (null, a stale shape) by just returning no colours. */
export function toColorsArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((c): c is string => typeof c === "string");
}
