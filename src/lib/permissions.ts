import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Redirects to /login if there is no session. Use at the top of every gated page/layout. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects non-admins to the dashboard. Use at the top of admin-only pages. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/** Client ids a MEMBER may see. Admins should skip this and query unfiltered. */
export async function getVisibleClientIds(userId: string): Promise<string[]> {
  const memberships = await prisma.clientMember.findMany({
    where: { userId },
    select: { clientId: true },
  });
  return memberships.map((m) => m.clientId);
}

/**
 * Throws Next's notFound() (via the caller) contract by returning a boolean —
 * callers should `if (!(await canAccessClient(...))) notFound()`.
 * A MEMBER who isn't assigned gets a 404, not a 403, so the client's existence isn't leaked.
 */
export async function canAccessClient(
  user: { id: string; role: "ADMIN" | "MEMBER" },
  clientId: string,
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  const membership = await prisma.clientMember.findUnique({
    where: { clientId_userId: { clientId, userId: user.id } },
  });
  return !!membership;
}

/** Fetches a client only if the user may see it; returns null otherwise so callers can 404. */
export async function getClientForUser(
  user: { id: string; role: "ADMIN" | "MEMBER" },
  clientId: string,
) {
  if (!(await canAccessClient(user, clientId))) return null;
  return prisma.client.findUnique({ where: { id: clientId } });
}
