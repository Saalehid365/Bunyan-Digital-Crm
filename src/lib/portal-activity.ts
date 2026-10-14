import { prisma } from "@/lib/prisma";

export type NewPortalActivity = {
  id: string;
  clientId: string;
  clientName: string;
  message: string;
  createdAt: string;
};

export type NewPortalActivities = { count: number; items: NewPortalActivity[] };

/** Logs a client-side portal action (brand kit saved, asset added, access submitted) as
 * an ordinary Activity entry — userId is deliberately left unset, which is what
 * getNewPortalActivity() uses to tell a client's own edit apart from a team member's. */
export async function notifyTeamOfPortalActivity(clientId: string, message: string) {
  await prisma.activity.create({ data: { clientId, type: "CLIENT_UPDATED", message } });
}

/**
 * Portal-originated activity (no team userId) newer than the client it belongs to was
 * last viewed on the Portal tab. Comparing each row against its own client's read-marker
 * can't be expressed as a single Prisma `where`, so this fetches recent candidates and
 * filters in memory — fine at this app's volume (an agency's own client list, not a
 * public feed).
 */
export async function getNewPortalActivity(clientIds: string[] | undefined): Promise<NewPortalActivities> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await prisma.activity.findMany({
    where: {
      type: "CLIENT_UPDATED",
      userId: null,
      createdAt: { gte: since },
      ...(clientIds ? { clientId: { in: clientIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      message: true,
      createdAt: true,
      client: { select: { id: true, name: true, portalActivityReadByTeamAt: true } },
    },
  });

  const unread = rows.filter((r) => r.createdAt > (r.client.portalActivityReadByTeamAt ?? new Date(0)));
  return {
    count: unread.length,
    items: unread.slice(0, 10).map((r) => ({
      id: r.id,
      clientId: r.client.id,
      clientName: r.client.name,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
