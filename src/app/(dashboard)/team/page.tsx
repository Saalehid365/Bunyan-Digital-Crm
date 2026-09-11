import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamTable } from "@/components/team/team-table";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";

export default async function TeamPage() {
  const admin = await requireAdmin();

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabledAt: true,
      permissions: true,
      passwordHash: true,
    },
  });
  const members = rows.map(({ passwordHash, ...rest }) => ({
    ...rest,
    hasPassword: passwordHash !== null,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>
        <InviteMemberDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Everyone with access</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamTable members={members} currentUserId={admin.id} />
        </CardContent>
      </Card>
    </div>
  );
}
