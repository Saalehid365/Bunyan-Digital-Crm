import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    const loginUrl = new URL("/login", request.url);
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
    "/settings/:path*",
  ],
};
