import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BASE_PATH } from "@/lib/base-path";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

// The client portal has its own, separate session cookie (see src/lib/portal-auth.ts) —
// deliberately not an Auth.js cookie, so this gate can never mistake a client session
// for a team one or vice versa.
const PORTAL_COOKIE_NAME = "bunyan-portal-session";

/**
 * Cheap, cookie-presence-only gate — it deliberately does not touch Prisma or verify the
 * session server-side (that happens per-route via requireUser()/requirePortalUser()).
 * This just keeps unauthenticated visitors from ever seeing gated markup before the real
 * check runs. Portal paths are gated by the portal cookie and redirect to /portal/login;
 * every other matched path is gated by the team session and redirects to /login.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPortal = pathname.startsWith("/portal");

  if (isPortal) {
    // /portal/login itself must stay reachable while signed out.
    if (pathname.startsWith("/portal/login")) return NextResponse.next();
    if (request.cookies.has(PORTAL_COOKIE_NAME)) return NextResponse.next();
    const loginUrl = new URL(`${BASE_PATH}/portal/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

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
    "/portal/:path*",
  ],
};
