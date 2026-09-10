import Link from "next/link";
import { format, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { Clock, UsersRound, ListChecks } from "lucide-react";
import { requireUser, getVisibleClientIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatMinutes } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "all";

function periodStart(period: Period): Date | undefined {
  const now = new Date();
  if (period === "week") return startOfWeek(now, { weekStartsOn: 1 });
  if (period === "month") return startOfMonth(now);
  return undefined;
}

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const { period: rawPeriod } = await searchParams;
  const period: Period = rawPeriod === "week" || rawPeriod === "all" ? rawPeriod : "month";

  const clientIds = isAdmin ? undefined : await getVisibleClientIds(user.id);
  const since = periodStart(period);

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...(since ? { workDate: { gte: startOfDay(since) } } : {}),
      task: {
        job: clientIds ? { clientId: { in: clientIds } } : {},
      },
    },
    orderBy: { workDate: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      task: {
        select: {
          title: true,
          job: {
            select: {
              id: true,
              title: true,
              clientId: true,
              client: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);

  const byUser = new Map<string, { name: string; minutes: number }>();
  for (const e of entries) {
    const key = e.userId ?? "unknown";
    const existing = byUser.get(key) ?? { name: e.user?.name ?? "Unknown", minutes: 0 };
    existing.minutes += e.minutes;
    byUser.set(key, existing);
  }
  const userBreakdown = Array.from(byUser.values()).sort((a, b) => b.minutes - a.minutes);

  const periods: { value: Period; label: string }[] = [
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "all", label: "All time" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Timesheets</h1>
          <p className="text-sm text-muted-foreground">Time logged across every job.</p>
        </div>
        <div className="flex items-center gap-1">
          {periods.map((p) => (
            <Link
              key={p.value}
              href={`/timesheets?period=${p.value}`}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs transition-colors",
                period === p.value
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Total logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {formatMinutes(totalMinutes)}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <UsersRound className="h-4 w-4 text-muted-foreground" />
              By team member
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No time logged in this period.</p>
            ) : (
              <ul className="space-y-2">
                {userBreakdown.map((u) => (
                  <li key={u.name} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{u.name}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatMinutes(u.minutes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Clock}
                title="No time logged yet"
                description="Log time against a task from its job's detail panel on the board."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Team member</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Job / Task</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                      {format(entry.workDate, "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{entry.user?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Link
                        href={`/clients/${entry.task.job.clientId}/board`}
                        className="text-sm text-foreground hover:text-primary"
                      >
                        {entry.task.job.client.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <p className="truncate text-sm text-foreground">{entry.task.job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{entry.task.title}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums text-foreground">
                      {formatMinutes(entry.minutes)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {entry.note || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
