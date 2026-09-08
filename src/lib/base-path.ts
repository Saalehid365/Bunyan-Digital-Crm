// Mirrors next.config.ts's basePath. Must be NEXT_PUBLIC_-prefixed so client components
// (e.g. the sign-out button) can read it too, not just server code. Anywhere we hand Auth.js
// an explicit redirect target ("/dashboard", "/login"), it needs this prefix manually —
// Auth.js isn't aware of Next's basePath the way next/link and next/navigation are.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
