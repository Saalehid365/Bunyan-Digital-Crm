import { addDays } from "date-fns";
import { requireUser, getVisibleClientIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { GBP, formatMinutes } from "@/lib/constants";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { RevenueByServiceChart } from "@/components/dashboard/revenue-by-service-chart";
import { UpcomingDeadlinesList } from "@/components/dashboard/upcoming-deadlines-list";
import { Timeline } from "@/components/activity/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const clientIds = isAdmin ? undefined : await getVisibleClientIds(user.id);
  const clientFilter = clientIds ? { id: { in: clientIds } } : {};
  const jobClientFilter = clientIds ? { clientId: { in: clientIds } } : {};

  const [activeClients, dueSoonJobs, recentActivity] = await Promise.all([
    prisma.client.count({ where: { ...clientFilter, status: "ACTIVE" } }),
    prisma.job.findMany({
      where: {
        ...jobClientFilter,
        stage: { not: "DONE" },
        dueDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: addDays(new Date(), 14) },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.activity.findMany({
      where: clientIds ? { clientId: { in: clientIds } } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } }, client: { select: { name: true } } },
    }),
  ]);

  const deadlineJobs = dueSoonJobs
    .filter((j) => j.dueDate)
    .map((j) => ({
      id: j.id,
      title: j.title,
      dueDate: j.dueDate as Date,
      clientId: j.client.id,
      clientName: j.client.name,
    }));

  const timelineEntries = recentActivity.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    createdAt: a.createdAt,
    userName: a.user?.name ?? null,
    clientName: a.client.name,
  }));

  if (isAdmin) {
    const [openJobs, doneThisWeek, activeServices, minutesThisWeekAgg] = await Promise.all([
      prisma.job.count({ where: { stage: { not: "DONE" } } }),
      prisma.job.count({
        where: { stage: "DONE", completedAt: { gte: addDays(new Date(), -7) } },
      }),
      prisma.clientService.findMany({
        where: { status: "ACTIVE" },
        include: { serviceType: true },
      }),
      prisma.timeEntry.aggregate({
        where: { workDate: { gte: addDays(new Date(), -7) } },
        _sum: { minutes: true },
      }),
    ]);

    const mrr = activeServices.reduce((sum, s) => sum + Number(s.monthlyValue ?? 0), 0);

    const byService = new Map<string, { name: string; value: number; color: string }>();
    for (const s of activeServices) {
      const key = s.serviceTypeId;
      const existing = byService.get(key) ?? {
        name: s.serviceType.name,
        value: 0,
        color: s.serviceType.colorHex,
      };
      existing.value += Number(s.monthlyValue ?? 0);
      byService.set(key, existing);
    }
    const chartData = Array.from(byService.values())
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Agency-wide view across every client.</p>
        </div>

        <MetricPanel
          heroLabel="Active monthly recurring value"
          heroValue={GBP.format(mrr)}
          heroSublabel={`Across ${activeServices.length} active service${activeServices.length === 1 ? "" : "s"}`}
          ledger={[
            { label: "Active clients", value: String(activeClients) },
            { label: "Open jobs", value: String(openJobs) },
            { label: "Completed this week", value: String(doneThisWeek) },
            { label: "Logged this week", value: formatMinutes(minutesThisWeekAgg._sum.minutes ?? 0) },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Revenue by service</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <RevenueByServiceChart data={chartData} />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Add a monthly value to a client&apos;s services to see the breakdown here.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Upcoming deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingDeadlinesList jobs={deadlineJobs} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline entries={timelineEntries} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const [myOpenJobs, myCompletedThisWeek, myMinutesThisWeekAgg] = await Promise.all([
    prisma.job.count({
      where: { ...jobClientFilter, assignedToId: user.id, stage: { not: "DONE" } },
    }),
    prisma.job.count({
      where: {
        ...jobClientFilter,
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
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s on for your clients.</p>
      </div>

      <MetricPanel
        heroLabel="Your open jobs"
        heroValue={String(myOpenJobs)}
        heroSublabel={`${myCompletedThisWeek} completed this week`}
        ledger={[
          { label: "Assigned clients", value: String(activeClients) },
          { label: "Due within 14 days", value: String(deadlineJobs.length) },
          { label: "Logged this week", value: formatMinutes(myMinutesThisWeekAgg._sum.minutes ?? 0) },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingDeadlinesList jobs={deadlineJobs} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline entries={timelineEntries} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
