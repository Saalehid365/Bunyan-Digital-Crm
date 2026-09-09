import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin, canAccessClient } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await requireAdmin();
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true, lineItems: true },
  });
  if (!invoice) return new NextResponse("Not found", { status: 404 });
  if (!(await canAccessClient(user, invoice.clientId))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderToBuffer(
    <InvoiceDocument
      data={{
        number: invoice.number,
        title: invoice.title,
        status: invoice.status,
        clientName: invoice.client.name,
        companyName: invoice.client.companyName,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        lineItems: invoice.lineItems.map((li) => ({
          description: li.description,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
        })),
      }}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="INV-${String(invoice.number).padStart(4, "0")}.pdf"`,
    },
  });
}
