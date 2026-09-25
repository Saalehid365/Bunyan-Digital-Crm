import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BASE_PATH } from "@/lib/base-path";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

/**
 * Cheap, cookie-presence-only gate for the dashboard route group — it deliberately does not
 * touch Prisma or verify the session server-side (that happens per-route via requireUser() in
 * src/lib/permissions.ts). This just keeps unauthenticated visitors from ever seeing dashboard
 * markup before the real check runs.
 */
export default function proxy(request: NextRequest) {
  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSessionCookie) {
    // Built explicitly with BASE_PATH rather than relying on Next's automatic basePath
    // handling — request.url here is the full incoming URL, and a plain root-relative
    // "/login" resolved against it strips any basePath prefix instead of preserving it.
    const loginUrl = new URL(`${BASE_PATH}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/board/:path*",
    "/team/:path*",
    "/revenue-finder/:path*",
    "/settings/:path*",
  ],
};
