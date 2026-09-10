import { addDays } from "date-fns";
import { KanbanSquare } from "lucide-react";
import { requireUser, getVisibleClientIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { GBP, formatMinutes } from "@/lib/constants";
import { getKanbanJobs, getClientServicesByClient, getAccessibleClients } from "@/lib/jobs-data";
import { getStaleLeads } from "@/lib/stale-leads";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { StaleLeadsCard } from "@/components/dashboard/stale-leads-card";
import { GlobalBoard } from "@/components/kanban/global-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const clientIds = isAdmin ? undefined : await getVisibleClientIds(user.id);
  const clientFilter = clientIds ? { id: { in: clientIds } } : {};

  const [activeClients, jobs, clients, clientServicesByClient, activeUsers] = await Promise.all([
    prisma.client.count({ where: { ...clientFilter, status: "ACTIVE" } }),
    getKanbanJobs(clientIds),
    getAccessibleClients(clientIds),
    getClientServicesByClient(clientIds),
    prisma.user.findMany({
      where: { disabledAt: null },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const dueSoonCount = jobs.filter(
    (j) =>
      j.dueDate &&
      j.stage !== "DONE" &&
      new Date(j.dueDate) <= addDays(new Date(), 14) &&
      new Date(j.dueDate) >= new Date(new Date().setHours(0, 0, 0, 0)),
  ).length;

  if (isAdmin) {
    const [openJobs, doneThisWeek, activeServices, minutesThisWeekAgg, staleLeads] = await Promise.all([
      prisma.job.count({ where: { stage: { not: "DONE" } } }),
      prisma.job.count({
        where: { stage: "DONE", completedAt: { gte: addDays(new Date(), -7) } },
      }),
      prisma.clientService.aggregate({
        where: { status: "ACTIVE", billingType: "MONTHLY" },
        _sum: { priceValue: true },
        _count: true,
      }),
      prisma.timeEntry.aggregate({
        where: { workDate: { gte: addDays(new Date(), -7) } },
        _sum: { minutes: true },
      }),
      getStaleLeads(),
    ]);

    const mrr = Number(activeServices._sum.priceValue ?? 0);

    return (
      <div className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
          <div className="rise" style={{ animationDelay: "0ms" }}>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Agency-wide view across every client.</p>
          </div>

          <div className="rise" style={{ animationDelay: "80ms" }}>
            <MetricPanel
              heroLabel="Active monthly recurring value"
              heroValue={GBP.format(mrr)}
              heroSublabel={`Across ${activeServices._count} active service${activeServices._count === 1 ? "" : "s"}`}
              ledger={[
                { label: "Active clients", value: String(activeClients) },
                { label: "Open jobs", value: String(openJobs) },
                { label: "Completed this week", value: String(doneThisWeek) },
                { label: "Logged this week", value: formatMinutes(minutesThisWeekAgg._sum.minutes ?? 0) },
              ]}
            />
          </div>

          {staleLeads.length > 0 ? (
            <StaleLeadsCard leads={staleLeads} style={{ animationDelay: "140ms" }} />
          ) : null}
        </div>

        <Card
          className="rise mx-4 flex flex-1 flex-col overflow-hidden md:mx-6 mb-4 md:mb-6"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <KanbanSquare className="h-4 w-4 text-muted-foreground" />
            Work board
          </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            <GlobalBoard
              jobs={jobs}
              clients={clients}
              currentUserId={user.id}
              isAdmin={isAdmin}
              assignableUsers={activeUsers}
              clientServicesByClient={clientServicesByClient}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const [myOpenJobs, myCompletedThisWeek, myMinutesThisWeekAgg] = await Promise.all([
    prisma.job.count({
      where: { ...(clientIds ? { clientId: { in: clientIds } } : {}), assignedToId: user.id, stage: { not: "DONE" } },
    }),
    prisma.job.count({
      where: {
        ...(clientIds ? { clientId: { in: clientIds } } : {}),
        assignedToId: user.id,
        stage: "DONE",
        completedAt: { gte: addDays(new Date(), -7) },
      },
    }),
    prisma.timeEntry.aggregate({
      where: { userId: user.id, workDate: { gte: addDays(new Date(), -7) } },
      _sum: { minutes: true },
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        <div className="rise" style={{ animationDelay: "0ms" }}>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s on for your clients.</p>
        </div>

        <div className="rise" style={{ animationDelay: "80ms" }}>
          <MetricPanel
            heroLabel="Your open jobs"
            heroValue={String(myOpenJobs)}
            heroSublabel={`${myCompletedThisWeek} completed this week`}
            ledger={[
              { label: "Assigned clients", value: String(activeClients) },
              { label: "Due within 14 days", value: String(dueSoonCount) },
              { label: "Logged this week", value: formatMinutes(myMinutesThisWeekAgg._sum.minutes ?? 0) },
            ]}
          />
        </div>
      </div>

      <Card
        className="rise mx-4 mb-4 flex flex-1 flex-col overflow-hidden md:mx-6 md:mb-6"
        style={{ animationDelay: "160ms" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <KanbanSquare className="h-4 w-4 text-muted-foreground" />
            Work board
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          <GlobalBoard
            jobs={jobs}
            clients={clients}
            currentUserId={user.id}
            isAdmin={isAdmin}
            assignableUsers={activeUsers}
            clientServicesByClient={clientServicesByClient}
          />
        </CardContent>
      </Card>
    </div>
  );
}
