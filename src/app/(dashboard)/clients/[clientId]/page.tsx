import { notFound } from "next/navigation";
import { requireUser, getClientForUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { AssignMembers } from "@/components/clients/assign-members";
import { formatMinutes } from "@/lib/constants";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();

  const [members, allUsers, jobCounts, timeAgg] = await Promise.all([
    prisma.clientMember.findMany({
      where: { clientId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    user.role === "ADMIN"
      ? prisma.user.findMany({
          where: { disabledAt: null },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.job.groupBy({
      by: ["stage"],
      where: { clientId },
      _count: true,
    }),
    prisma.timeEntry.aggregate({
      where: { task: { job: { clientId } } },
      _sum: { minutes: true },
    }),
  ]);

  const openJobs = jobCounts
    .filter((j) => j.stage !== "DONE")
    .reduce((sum, j) => sum + j._count, 0);
  const doneJobs = jobCounts.find((j) => j.stage === "DONE")?._count ?? 0;
  const totalMinutes = timeAgg._sum.minutes ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Client details</CardTitle>
            {user.role === "ADMIN" ? <ClientFormDialog client={client} /> : null}
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Contact name</dt>
                <dd className="mt-0.5 text-foreground">{client.contactName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Contact email</dt>
                <dd className="mt-0.5 text-foreground">{client.contactEmail || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Contact phone</dt>
                <dd className="mt-0.5 text-foreground">{client.contactPhone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Client since</dt>
                <dd className="mt-0.5 text-foreground">
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(client.createdAt)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-foreground">{client.notes || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Work summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Open jobs</dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
                    {openJobs}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Completed</dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
                    {doneJobs}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Time logged</dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
                    {formatMinutes(totalMinutes)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {user.role === "ADMIN" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Assigned team</CardTitle>
              </CardHeader>
              <CardContent>
                <AssignMembers
                  clientId={clientId}
                  assigned={members.map((m) => m.user)}
                  available={allUsers}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
