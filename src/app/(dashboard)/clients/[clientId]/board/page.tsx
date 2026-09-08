import { notFound } from "next/navigation";
import { requireUser, getClientForUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Board } from "@/components/kanban/board";
import type { KanbanTask } from "@/components/kanban/types";

export default async function ClientBoardPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();

  const [tasks, members, clientServices] = await Promise.all([
    prisma.task.findMany({
      where: { clientId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        clientService: { include: { serviceType: true } },
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

  const kanbanTasks: KanbanTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    stage: t.stage,
    position: t.position,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    clientId: t.clientId,
    clientName: client.name,
    clientServiceId: t.clientServiceId,
    serviceTypeName: t.clientService?.serviceType.name ?? null,
    serviceTypeColor: t.clientService?.serviceType.colorHex ?? null,
    assignedTo: t.assignedTo,
  }));

  return (
    <div className="flex flex-1 flex-col">
      <Board
        initialTasks={kanbanTasks}
        showClient={false}
        clientId={clientId}
        assignableUsers={Array.from(assignableMap.values())}
        clientServicesByClient={{
          [clientId]: clientServices.map((s) => ({
            id: s.id,
            name: s.label ? `${s.serviceType.name} (${s.label})` : s.serviceType.name,
          })),
        }}
      />
    </div>
  );
}
