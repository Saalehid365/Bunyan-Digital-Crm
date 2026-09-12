import { isPast, isToday } from "date-fns";
import { Sun, ListTodo, Clock3, CalendarClock, KanbanSquare } from "lucide-react";
import { requireUser, getVisibleClientIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getAccessibleClients } from "@/lib/jobs-data";
import { getMyOpenJobs, getMyDayCalendly } from "@/lib/my-day-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PRIORITY_DOT_CLASS } from "@/lib/constants";
import Link from "next/link";
import { PersonalTaskList } from "@/components/my-day/personal-task-list";
import { FollowUpList } from "@/components/my-day/follow-up-list";
import { CalendlyMeetingsCard } from "@/components/my-day/calendly-meetings-card";

export default async function MyDayPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const clientIds = isAdmin ? undefined : await getVisibleClientIds(user.id);

  const [personalTasks, followUps, myJobs, calendly, accessibleClients, activeUsers] = await Promise.all([
    prisma.personalTask.findMany({
      where: { userId: user.id },
      orderBy: [{ done: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    prisma.followUp.findMany({
      where: { assignedToId: user.id },
      include: { client: { select: { id: true, name: true } } },
      orderBy: [{ done: "asc" }, { dueDate: "asc" }],
    }),
    getMyOpenJobs(user.id),
    getMyDayCalendly(user.id),
    getAccessibleClients(clientIds),
    prisma.user.findMany({
      where: { disabledAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const overdueFollowUps = followUps.filter((f) => !f.done && isPast(new Date(f.dueDate)) && !isToday(new Date(f.dueDate)));
  const dueTodayTasks = personalTasks.filter((t) => !t.done && t.dueDate && isToday(t.dueDate));
  const dueTodayFollowUps = followUps.filter((f) => !f.done && isToday(new Date(f.dueDate)));
  const todaysMeetings =
    calendly.connected && !calendly.error ? calendly.meetings.filter((m) => isToday(new Date(m.startTime))) : [];

  const stats = [
    { icon: Clock3, label: "Overdue follow-ups", value: overdueFollowUps.length, tone: overdueFollowUps.length > 0 ? "text-destructive" : "text-foreground" },
    { icon: ListTodo, label: "Due today", value: dueTodayTasks.length + dueTodayFollowUps.length, tone: "text-foreground" },
    { icon: CalendarClock, label: "Today's meetings", value: todaysMeetings.length, tone: "text-foreground" },
    { icon: KanbanSquare, label: "Open jobs", value: myJobs.length, tone: "text-foreground" },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="rise" style={{ animationDelay: "0ms" }}>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
          <Sun className="h-6 w-6 text-primary" />
          My Day
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <p className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FollowUpList
                followUps={followUps.map((f) => ({
                  id: f.id,
                  title: f.title,
                  notes: f.notes,
                  dueDate: f.dueDate.toISOString(),
                  done: f.done,
                  clientId: f.client?.id ?? null,
                  clientName: f.client?.name ?? null,
                  assignedToName: null,
                }))}
                clients={accessibleClients}
                assignableUsers={activeUsers}
                currentUserId={user.id}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <KanbanSquare className="h-4 w-4 text-muted-foreground" />
                Your open jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myJobs.length === 0 ? (
                <EmptyState icon={KanbanSquare} title="Nothing assigned" description="Jobs assigned to you will show up here." />
              ) : (
                <ul className="space-y-1">
                  {myJobs.map((job) => (
                    <li key={job.id}>
                      <Link
                        href={`/clients/${job.clientId}/board`}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-1 py-1.5 text-sm hover:bg-accent/40"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT_CLASS[job.priority]}`} />
                          <span className="truncate text-foreground">{job.title}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{job.clientName}</span>
                        </span>
                        {job.dueDate ? (
                          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                            {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(job.dueDate))}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                My tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalTaskList
                tasks={personalTasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  done: t.done,
                  dueDate: t.dueDate ? t.dueDate.toISOString() : null,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendlyMeetingsCard calendly={calendly} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
