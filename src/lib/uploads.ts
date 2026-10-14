/** Shared by the upload route and every "attach a file" UI — keep these in sync. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB — see AGENTS.md note on Netlify's ~6MB function request-body ceiling
export const MAX_UPLOAD_LABEL = "5MB";

export const ALLOWED_UPLOAD_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

/** Keeps the blob's object key filesystem/URL-safe while staying recognisable in logs. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-150) || "file";
}
