import { requireUser, getVisibleClientIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { GlobalBoard } from "@/components/kanban/global-board";
import type { KanbanJob } from "@/components/kanban/types";

export default async function GlobalBoardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const clientIds = isAdmin ? undefined : await getVisibleClientIds(user.id);
  const clientFilter = clientIds ? { clientId: { in: clientIds } } : {};

  const [jobs, clients, activeUsers] = await Promise.all([
    prisma.job.findMany({
      where: clientFilter,
      include: {
        client: { select: { id: true, name: true } },
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
    prisma.client.findMany({
      where: clientIds ? { id: { in: clientIds } } : {},
      select: {
        id: true,
        services: { include: { serviceType: true } },
      },
    }),
    prisma.user.findMany({
      where: { disabledAt: null },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const kanbanJobs: KanbanJob[] = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    stage: job.stage,
    position: job.position,
    priority: job.priority,
    dueDate: job.dueDate ? job.dueDate.toISOString() : null,
    clientId: job.clientId,
    clientName: job.client.name,
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

  const clientServicesByClient = Object.fromEntries(
    clients.map((c) => [
      c.id,
      c.services.map((s) => ({ id: s.id, name: s.serviceType.name })),
    ]),
  );

  return (
    <GlobalBoard
      jobs={kanbanJobs}
      currentUserId={user.id}
      isAdmin={isAdmin}
      assignableUsers={activeUsers}
      clientServicesByClient={clientServicesByClient}
    />
  );
}
