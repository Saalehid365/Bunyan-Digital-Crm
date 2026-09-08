import { requireUser, getVisibleClientIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { GlobalBoard } from "@/components/kanban/global-board";
import type { KanbanTask } from "@/components/kanban/types";

export default async function GlobalBoardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const clientIds = isAdmin ? undefined : await getVisibleClientIds(user.id);
  const clientFilter = clientIds ? { clientId: { in: clientIds } } : {};

  const [tasks, clients, activeUsers] = await Promise.all([
    prisma.task.findMany({
      where: clientFilter,
      include: {
        client: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        clientService: { include: { serviceType: true } },
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

  const kanbanTasks: KanbanTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    stage: t.stage,
    position: t.position,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    clientId: t.clientId,
    clientName: t.client.name,
    clientServiceId: t.clientServiceId,
    serviceTypeName: t.clientService?.serviceType.name ?? null,
    serviceTypeColor: t.clientService?.serviceType.colorHex ?? null,
    assignedTo: t.assignedTo,
  }));

  const clientServicesByClient = Object.fromEntries(
    clients.map((c) => [
      c.id,
      c.services.map((s) => ({ id: s.id, name: s.serviceType.name })),
    ]),
  );

  return (
    <GlobalBoard
      tasks={kanbanTasks}
      currentUserId={user.id}
      isAdmin={isAdmin}
      assignableUsers={activeUsers}
      clientServicesByClient={clientServicesByClient}
    />
  );
}
