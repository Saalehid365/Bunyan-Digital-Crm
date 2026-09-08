import { requireUser, getVisibleClientIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getKanbanJobs, getClientServicesByClient, getAccessibleClients } from "@/lib/jobs-data";
import { GlobalBoard } from "@/components/kanban/global-board";

export default async function GlobalBoardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const clientIds = isAdmin ? undefined : await getVisibleClientIds(user.id);

  const [jobs, clients, clientServicesByClient, activeUsers] = await Promise.all([
    getKanbanJobs(clientIds),
    getAccessibleClients(clientIds),
    getClientServicesByClient(clientIds),
    prisma.user.findMany({
      where: { disabledAt: null },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <GlobalBoard
      jobs={jobs}
      clients={clients}
      currentUserId={user.id}
      isAdmin={isAdmin}
      assignableUsers={activeUsers}
      clientServicesByClient={clientServicesByClient}
    />
  );
}
