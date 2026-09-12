import { notFound } from "next/navigation";
import { requireUser, getClientForUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getKanbanJobs } from "@/lib/jobs-data";
import { JobsView } from "@/components/jobs/jobs-view";

export default async function ClientBoardPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();

  const [jobs, members, clientServices, quotes, invoices] = await Promise.all([
    getKanbanJobs([clientId]),
    prisma.clientMember.findMany({
      where: { clientId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.clientService.findMany({
      where: { clientId },
      include: { serviceType: true },
    }),
    prisma.quote.findMany({ where: { clientId }, select: { id: true, number: true, status: true }, orderBy: { number: "desc" } }),
    prisma.invoice.findMany({ where: { clientId }, select: { id: true, number: true, status: true }, orderBy: { number: "desc" } }),
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", disabledAt: null },
    select: { id: true, name: true, email: true },
  });
  const assignableMap = new Map(
    [...members.map((m) => m.user), ...admins].map((u) => [u.id, u]),
  );

  return (
    <JobsView
      initialJobs={jobs}
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
      quotesByClient={{ [clientId]: quotes }}
      invoicesByClient={{ [clientId]: invoices }}
    />
  );
}
