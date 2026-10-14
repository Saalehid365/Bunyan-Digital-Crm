import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { markPortalMessagesReadByClient } from "@/server/actions/portal-actions";
import { PortalMessages } from "@/components/portal/portal-messages";

export default async function PortalMessagesPage() {
  const portalUser = await requirePortalUser();

  const messages = await prisma.clientMessage.findMany({
    where: { clientId: portalUser.clientId },
    orderBy: { createdAt: "asc" },
    include: { senderUser: { select: { name: true } }, senderPortalUser: { select: { name: true } } },
  });

  await markPortalMessagesReadByClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">A direct line to the team working on {portalUser.clientName}.</p>
      </div>
      <PortalMessages
        messages={messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderKind: m.senderKind,
          senderName: m.senderKind === "TEAM" ? (m.senderUser?.name ?? "Bunyan Digital") : (m.senderPortalUser?.name ?? portalUser.name),
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
