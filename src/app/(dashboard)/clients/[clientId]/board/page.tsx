import { notFound } from "next/navigation";
import { requireUser, getClientForUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { JobsView } from "@/components/jobs/jobs-view";
import type { KanbanJob } from "@/components/kanban/types";

export default async function ClientBoardPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();

  const [jobs, members, clientServices] = await Promise.all([
    prisma.job.findMany({
      where: { clientId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        clientService: { include: { serviceType: true } },
        tasks: {
          orderBy: { position: "asc" },
          include: {
            timeEntries: {
              orderBy: { workDate: "desc" },
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    prisma.clientMember.findMany({
      where: { clientId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.clientService.findMany({
      where: { clientId },
      include: { serviceType: true },
    }),
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", disabledAt: null },
    select: { id: true, name: true, email: true },
  });
  const assignableMap = new Map(
    [...members.map((m) => m.user), ...admins].map((u) => [u.id, u]),
  );

  const kanbanJobs: KanbanJob[] = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    stage: job.stage,
    position: job.position,
    priority: job.priority,
    dueDate: job.dueDate ? job.dueDate.toISOString() : null,
    clientId: job.clientId,
    clientName: client.name,
    clientServiceId: job.clientServiceId,
    serviceTypeName: job.clientService?.serviceType.name ?? null,
    serviceTypeColor: job.clientService?.serviceType.colorHex ?? null,
    assignedTo: job.assignedTo,
    tasks: job.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      done: task.done,
      totalMinutes: task.timeEntries.reduce((sum, e) => sum + e.minutes, 0),
      timeEntries: task.timeEntries.map((e) => ({
        id: e.id,
        minutes: e.minutes,
        note: e.note,
        workDate: e.workDate.toISOString(),
        userId: e.userId,
        userName: e.user?.name ?? null,
      })),
    })),
  }));

  return (
    <JobsView
      initialJobs={kanbanJobs}
      showClient={false}
      clientId={clientId}
      currentUserId={user.id}
      isAdmin={user.role === "ADMIN"}
      assignableUsers={Array.from(assignableMap.values())}
      clientServicesByClient={{
        [clientId]: clientServices.map((s) => ({
          id: s.id,
          name: s.label ? `${s.serviceType.name} (${s.label})` : s.serviceType.name,
        })),
      }}
    />
  );
}
