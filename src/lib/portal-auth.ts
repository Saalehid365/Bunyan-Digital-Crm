import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BASE_PATH } from "@/lib/base-path";

/**
 * The client portal's own session mechanism — deliberately NOT Auth.js. Auth.js's
 * PrismaAdapter and the team's User/Role model are a single, coupled identity system;
 * bolting a second "CLIENT" identity onto it would mean auditing every requireUser() /
 * requireAdmin() call site in the team app to make sure a portal session could never
 * satisfy one by accident. A separate cookie, separate session table and separate
 * requirePortalUser() guard makes that cross-tenant risk structurally impossible instead
 * of something to audit for.
 */
const COOKIE_NAME = "bunyan-portal-session";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPortalSession(portalUserId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.clientPortalSession.create({
    data: { portalUserId, tokenHash: hashToken(token), expiresAt },
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: BASE_PATH || "/",
    expires: expiresAt,
  });
}

export async function destroyPortalSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.clientPortalSession.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  jar.delete({ name: COOKIE_NAME, path: BASE_PATH || "/" });
}

export type PortalUser = {
  id: string;
  name: string;
  email: string;
  clientId: string;
  clientName: string;
  messagesReadAt: Date | null;
};

/** Reads and validates the portal session cookie. Returns null if absent, expired, or the account is disabled. */
export async function getPortalUser(): Promise<PortalUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.clientPortalSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { portalUser: { include: { client: { select: { name: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (session.portalUser.disabledAt) return null;

  return {
    id: session.portalUser.id,
    name: session.portalUser.name,
    email: session.portalUser.email,
    clientId: session.portalUser.clientId,
    clientName: session.portalUser.client.name,
    messagesReadAt: session.portalUser.messagesReadAt,
  };
}

/** Use at the top of every gated portal page/layout. Redirects to the portal login if there's no valid session. */
export async function requirePortalUser(): Promise<PortalUser> {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");
  return user;
}
