import { notFound } from "next/navigation";
import { requireAdmin, getClientForUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getClientServicesByClient } from "@/lib/jobs-data";
import { QuotesInvoicesView } from "@/components/billing/quotes-invoices-view";
import type { QuoteRow, InvoiceRow } from "@/components/billing/types";

export default async function ClientBillingPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireAdmin();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();

  const [quotes, invoices, clientServicesByClient] = await Promise.all([
    prisma.quote.findMany({
      where: { clientId },
      include: { lineItems: true, invoice: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { clientId },
      include: { lineItems: true, quote: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getClientServicesByClient([clientId]),
  ]);

  const quoteRows: QuoteRow[] = quotes.map((q) => ({
    id: q.id,
    number: q.number,
    title: q.title,
    status: q.status,
    clientId: q.clientId,
    clientName: client.name,
    issueDate: q.issueDate,
    expiryDate: q.expiryDate,
    notes: q.notes,
    hasInvoice: q.invoice !== null,
    lineItems: q.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
    })),
  }));

  const invoiceRows: InvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    title: inv.title,
    status: inv.status,
    clientId: inv.clientId,
    clientName: client.name,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    paidAt: inv.paidAt,
    notes: inv.notes,
    quoteNumber: inv.quote?.number ?? null,
    lineItems: inv.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
    })),
  }));

  return (
    <QuotesInvoicesView
      quotes={quoteRows}
      invoices={invoiceRows}
      clients={[{ id: client.id, name: client.name }]}
      clientServicesByClient={clientServicesByClient}
    />
  );
}
