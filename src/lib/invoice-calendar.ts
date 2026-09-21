import { prisma } from "@/lib/prisma";
import type { CalendarInvoiceEntry } from "@/components/billing/payments-calendar";

/** Every invoice with a due date, scoped to clientIds for a MEMBER or every client when
 * undefined (admin) — for the Dashboard's payments calendar. Skips the lineItems join
 * (no amount on dashboard chips) to keep this one bounded query cheap admin-wide. */
export async function getInvoiceCalendarEntries(clientIds: string[] | undefined): Promise<CalendarInvoiceEntry[]> {
  const invoices = await prisma.invoice.findMany({
    where: {
      dueDate: { not: null },
      ...(clientIds ? { clientId: { in: clientIds } } : {}),
    },
    select: {
      id: true,
      clientId: true,
      title: true,
      status: true,
      dueDate: true,
      client: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return invoices.map((i) => ({
    id: i.id,
    clientId: i.clientId,
    clientName: i.client.name,
    title: i.title,
    status: i.status,
    dueDate: i.dueDate!,
  }));
}
