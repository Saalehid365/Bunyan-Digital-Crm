import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { PortalTeamView } from "@/components/portal/portal-team-view";

export default async function PortalTeamPage() {
  const portalUser = await requirePortalUser();

  const teammates = await prisma.clientPortalUser.findMany({
    where: { clientId: portalUser.clientId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, disabledAt: true, lastLoginAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone at {portalUser.clientName} who can sign in to this portal.
        </p>
      </div>
      <PortalTeamView
        currentUserId={portalUser.id}
        teammates={teammates.map((t) => ({
          ...t,
          disabledAt: t.disabledAt?.toISOString() ?? null,
          lastLoginAt: t.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
