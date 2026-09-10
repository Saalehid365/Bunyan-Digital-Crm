import { notFound } from "next/navigation";
import { KeyRound } from "lucide-react";
import { requireUser, getClientForUser, hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessList } from "@/components/clients/access-list";
import { AccessFormDialog } from "@/components/clients/access-form-dialog";
import { EmptyState } from "@/components/empty-state";

export default async function ClientAccessPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();
  const canManageClients = await hasPermission(user, "MANAGE_CLIENTS");

  const entries = await prisma.clientAccess.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    select: { id: true, label: true, username: true, url: true, notes: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Account access
          </CardTitle>
          {canManageClients ? <AccessFormDialog clientId={clientId} /> : null}
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="No access details saved yet"
              description="Store logins the client has given you — marketplace accounts, hosting, ad platforms — so the team can get to work without chasing them down."
              action={canManageClients ? <AccessFormDialog clientId={clientId} /> : undefined}
            />
          ) : (
            <AccessList clientId={clientId} entries={entries} canManageClients={canManageClients} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
