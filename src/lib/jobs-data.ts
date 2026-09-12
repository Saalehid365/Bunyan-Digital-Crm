import { prisma } from "@/lib/prisma";
import type { KanbanJob } from "@/components/kanban/types";
import type { QuoteStatus, InvoiceStatus } from "@prisma/client";

/** Fetches jobs (with their task checklists + time entries) scoped to the given client ids,
 * or every client if clientIds is undefined (admin view). Shared by the dashboard and Jobs page
 * so both render identical data with one query shape. */
export async function getKanbanJobs(clientIds: string[] | undefined): Promise<KanbanJob[]> {
  const jobs = await prisma.job.findMany({
    where: clientIds ? { clientId: { in: clientIds } } : {},
    include: {
      client: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      clientService: { include: { serviceType: true } },
      quote: { select: { id: true, number: true, status: true } },
      invoice: { select: { id: true, number: true, status: true, paidAt: true } },
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
  });

  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    stage: job.stage,
    position: job.position,
    priority: job.priority,
    recurrence: job.recurrence,
    dueDate: job.dueDate ? job.dueDate.toISOString() : null,
    clientId: job.clientId,
    clientName: job.client.name,
    clientServiceId: job.clientServiceId,
    serviceTypeName: job.clientService?.serviceType.name ?? null,
    serviceTypeColor: job.clientService?.serviceType.colorHex ?? null,
    assignedTo: job.assignedTo,
    assignmentAckedAt: job.assignmentAckedAt ? job.assignmentAckedAt.toISOString() : null,
    linkedQuote: job.quote ? { id: job.quote.id, number: job.quote.number, status: job.quote.status } : null,
    linkedInvoice: job.invoice
      ? {
          id: job.invoice.id,
          number: job.invoice.number,
          status: job.invoice.status,
          paidAt: job.invoice.paidAt ? job.invoice.paidAt.toISOString() : null,
        }
      : null,
    tasks: job.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
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
}

/** Every client the user can see, for the "which client is this job for" picker —
 * independent of who already has jobs, so a brand-new client is still selectable. */
export async function getAccessibleClients(
  clientIds: string[] | undefined,
): Promise<{ id: string; name: string }[]> {
  return prisma.client.findMany({
    where: clientIds ? { id: { in: clientIds } } : {},
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getClientServicesByClient(
  clientIds: string[] | undefined,
): Promise<Record<string, { id: string; name: string }[]>> {
  const clients = await prisma.client.findMany({
    where: clientIds ? { id: { in: clientIds } } : {},
    select: {
      id: true,
      services: { include: { serviceType: true } },
    },
  });

  return Object.fromEntries(
    clients.map((c) => [
      c.id,
      c.services.map((s) => ({ id: s.id, name: s.serviceType.name })),
    ]),
  );
}

/** Every quote and invoice per client, for the "link a quote/invoice to this
 * job" pickers on one-off jobs — scoped the same way getClientServicesByClient is. */
export async function getQuotesAndInvoicesByClient(clientIds: string[] | undefined): Promise<{
  quotesByClient: Record<string, { id: string; number: number; status: QuoteStatus }[]>;
  invoicesByClient: Record<string, { id: string; number: number; status: InvoiceStatus }[]>;
}> {
  const clients = await prisma.client.findMany({
    where: clientIds ? { id: { in: clientIds } } : {},
    select: {
      id: true,
      quotes: { select: { id: true, number: true, status: true }, orderBy: { number: "desc" } },
      invoices: { select: { id: true, number: true, status: true }, orderBy: { number: "desc" } },
    },
  });

  return {
    quotesByClient: Object.fromEntries(clients.map((c) => [c.id, c.quotes])),
    invoicesByClient: Object.fromEntries(clients.map((c) => [c.id, c.invoices])),
  };
}
