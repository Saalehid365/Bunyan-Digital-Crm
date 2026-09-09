import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin, canAccessClient } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { QuoteDocument } from "@/lib/pdf/quote-document";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  const user = await requireAdmin();
  const { quoteId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { client: true, lineItems: true },
  });
  if (!quote) return new NextResponse("Not found", { status: 404 });
  if (!(await canAccessClient(user, quote.clientId))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderToBuffer(
    <QuoteDocument
      data={{
        number: quote.number,
        title: quote.title,
        status: quote.status,
        clientName: quote.client.name,
        companyName: quote.client.companyName,
        issueDate: quote.issueDate,
        expiryDate: quote.expiryDate,
        notes: quote.notes,
        lineItems: quote.lineItems.map((li) => ({
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
      "Content-Disposition": `inline; filename="Q-${String(quote.number).padStart(4, "0")}.pdf"`,
    },
  });
}
