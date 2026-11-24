import { prisma } from "@/lib/prisma";
import type { PortalNotificationKind } from "@prisma/client";

export type NewPortalNotification = {
  id: string;
  kind: PortalNotificationKind;
  message: string;
  ctaPath: string;
  createdAt: string;
};

export type NewPortalNotifications = { count: number; items: NewPortalNotification[] };

/** Logs a "the team sent you something" event for the client portal's live toast feed —
 * every kind lands here, even ones (Documents, Messages) whose nav badge is computed from
 * their own content instead of this table. */
export async function logPortalNotification({
  clientId,
  kind,
  message,
  ctaPath,
}: {
  clientId: string;
  kind: PortalNotificationKind;
  message: string;
  ctaPath: string;
}) {
  await prisma.portalNotification.create({ data: { clientId, kind, message, ctaPath } });
}

/** Recent notifications for a client's live toast poll — dedup against already-toasted
 * ids happens client-side, same as PortalActivityLiveAlerts on the team side. */
export async function getNewPortalNotifications(clientId: string): Promise<NewPortalNotifications> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await prisma.portalNotification.findMany({
    where: { clientId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return {
    count: rows.length,
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      message: r.message,
      ctaPath: r.ctaPath,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

function readMarkers(value: unknown): Partial<Record<PortalNotificationKind, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Partial<Record<PortalNotificationKind, string>>;
}

/** Nav badge counts for the kinds that have their own tab (Products, Overview) — each is
 * "notifications of that kind newer than this client's last visit to that tab". */
export async function getPortalNotificationBadges(
  clientId: string,
  readAt: unknown,
): Promise<Partial<Record<PortalNotificationKind, number>>> {
  const markers = readMarkers(readAt);
  const kinds: PortalNotificationKind[] = ["PRODUCT", "OVERVIEW"];
  const counts = await Promise.all(
    kinds.map((kind) =>
      prisma.portalNotification.count({
        where: {
          clientId,
          kind,
          createdAt: { gt: markers[kind] ? new Date(markers[kind]!) : new Date(0) },
        },
      }),
    ),
  );
  return Object.fromEntries(kinds.map((kind, i) => [kind, counts[i]]));
}

/** Marks one kind's tab as viewed — bumps just that key in the Json map, leaving the
 * others untouched. */
export async function markPortalNotificationsRead(clientId: string, kind: PortalNotificationKind) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { portalNotificationsReadAt: true } });
  const markers = readMarkers(client?.portalNotificationsReadAt);
  markers[kind] = new Date().toISOString();
  await prisma.client.update({ where: { id: clientId }, data: { portalNotificationsReadAt: markers } });
}
