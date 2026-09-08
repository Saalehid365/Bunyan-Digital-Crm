import { subDays } from "date-fns";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { GBP, formatMinutes } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueByServiceChart } from "@/components/dashboard/revenue-by-service-chart";
import { BarList } from "@/components/dashboard/bar-list";

export default async function ReportsPage() {
  await requireAdmin();
  const since = subDays(new Date(), 30);

  const [activeServices, oneOffServices, recentEntries] = await Promise.all([
    prisma.clientService.findMany({
      where: { status: "ACTIVE", billingType: "MONTHLY" },
      include: { serviceType: true, client: { select: { id: true, name: true } } },
    }),
    prisma.clientService.findMany({
      where: { billingType: "ONE_OFF" },
      select: { priceValue: true },
    }),
    prisma.timeEntry.findMany({
      where: { workDate: { gte: since } },
      include: {
        user: { select: { id: true, name: true } },
        task: {
          select: {
            job: { select: { client: { select: { id: true, name: true } } } },
          },
        },
      },
    }),
  ]);

  const mrr = activeServices.reduce((sum, s) => sum + Number(s.priceValue ?? 0), 0);
  const oneOffTotal = oneOffServices.reduce((sum, s) => sum + Number(s.priceValue ?? 0), 0);

  const revenueByService = new Map<string, { name: string; value: number; color: string }>();
  for (const s of activeServices) {
    const key = s.serviceTypeId;
    const existing = revenueByService.get(key) ?? {
      name: s.serviceType.name,
      value: 0,
      color: s.serviceType.colorHex,
    };
    existing.value += Number(s.priceValue ?? 0);
    revenueByService.set(key, existing);
  }
  const serviceChartData = Array.from(revenueByService.values())
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const revenueByClient = new Map<string, { label: string; value: number }>();
  for (const s of activeServices) {
    const key = s.client.id;
    const existing = revenueByClient.get(key) ?? { label: s.client.name, value: 0 };
    existing.value += Number(s.priceValue ?? 0);
    revenueByClient.set(key, existing);
  }
  const clientRevenue = Array.from(revenueByClient.values())
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const hoursByClient = new Map<string, { label: string; value: number }>();
  const hoursByUser = new Map<string, { label: string; value: number }>();
  for (const e of recentEntries) {
    const clientKey = e.task.job.client.id;
    const clientExisting = hoursByClient.get(clientKey) ?? { label: e.task.job.client.name, value: 0 };
    clientExisting.value += e.minutes;
    hoursByClient.set(clientKey, clientExisting);

    const userKey = e.userId ?? "unknown";
    const userExisting = hoursByUser.get(userKey) ?? { label: e.user?.name ?? "Unknown", value: 0 };
    userExisting.value += e.minutes;
    hoursByUser.set(userKey, userExisting);
  }
  const clientHours = Array.from(hoursByClient.values()).sort((a, b) => b.value - a.value).slice(0, 8);
  const userHours = Array.from(hoursByUser.values()).sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Revenue and time, at a glance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">One-off revenue</CardTitle>
          <CardDescription>Total across every one-off service ever added</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            {GBP.format(oneOffTotal)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue by service</CardTitle>
            <CardDescription>Active monthly value: {GBP.format(mrr)}</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceChartData.length > 0 ? (
              <RevenueByServiceChart data={serviceChartData} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No active service revenue yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue by client</CardTitle>
            <CardDescription>Top clients by active monthly value</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList items={clientRevenue} valueFormatter={(v) => GBP.format(v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Hours by client</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList items={clientHours} valueFormatter={formatMinutes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Hours by team member</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList items={userHours} valueFormatter={formatMinutes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
