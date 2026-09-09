"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, canAccessClient } from "@/lib/permissions";
import { quoteSchema, quoteStatusEnum } from "@/lib/validations/quote";
import { QUOTE_STATUS_LABEL } from "@/lib/constants";

function revalidateQuote(clientId: string) {
  revalidatePath("/invoices");
  revalidatePath(`/clients/${clientId}/billing`);
  revalidatePath(`/clients/${clientId}/activity`);
  revalidatePath("/dashboard");
}

export async function createQuote(formData: FormData) {
  const user = await requireAdmin();

  const parsed = quoteSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    issueDate: formData.get("issueDate"),
    expiryDate: formData.get("expiryDate"),
    notes: formData.get("notes"),
    lineItemsJson: formData.get("lineItemsJson"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (!(await canAccessClient(user, data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const quote = await prisma.quote.create({
    data: {
      clientId: data.clientId,
      title: data.title,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      notes: data.notes || undefined,
      createdById: user.id,
      lineItems: {
        create: data.lineItemsJson.map((item, i) => ({
          clientServiceId: item.clientServiceId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          position: i,
        })),
      },
      activities: {
        create: {
          clientId: data.clientId,
          type: "CREATED",
          message: `Quote "${data.title}" created by ${user.name ?? user.email}`,
          userId: user.id,
        },
      },
    },
  });

  revalidateQuote(data.clientId);
  return { id: quote.id };
}

export async function updateQuoteStatus(quoteId: string, status: unknown) {
  const user = await requireAdmin();
  const parsedStatus = quoteStatusEnum.safeParse(status);
  if (!parsedStatus.success) return { error: "Invalid status" };

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return { error: "Quote not found" };
  if (!(await canAccessClient(user, quote.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.quote.update({ where: { id: quoteId }, data: { status: parsedStatus.data } });

  if (quote.status !== parsedStatus.data) {
    await prisma.activity.create({
      data: {
        clientId: quote.clientId,
        quoteId: quote.id,
        type: "QUOTE_STATUS_CHANGE",
        message: `Quote "${quote.title}" moved to ${QUOTE_STATUS_LABEL[parsedStatus.data]} by ${user.name ?? user.email}`,
        userId: user.id,
      },
    });
  }

  revalidateQuote(quote.clientId);
  return { ok: true };
}

/** Copies a quote's line items into a new, linked Invoice. The quote itself is left as-is. */
export async function convertQuoteToInvoice(quoteId: string) {
  const user = await requireAdmin();

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { lineItems: true, invoice: true },
  });
  if (!quote) return { error: "Quote not found" };
  if (quote.invoice) return { error: "This quote has already been converted to an invoice." };
  if (!(await canAccessClient(user, quote.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const invoice = await prisma.invoice.create({
    data: {
      clientId: quote.clientId,
      quoteId: quote.id,
      title: quote.title,
      createdById: user.id,
      lineItems: {
        create: quote.lineItems.map((item) => ({
          clientServiceId: item.clientServiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          position: item.position,
        })),
      },
      activities: {
        create: {
          clientId: quote.clientId,
          type: "CREATED",
          message: `Invoice "${quote.title}" created from quote by ${user.name ?? user.email}`,
          userId: user.id,
        },
      },
    },
  });

  revalidateQuote(quote.clientId);
  return { id: invoice.id };
}

export async function deleteQuote(quoteId: string, clientId: string) {
  const user = await requireAdmin();
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }
  await prisma.quote.delete({ where: { id: quoteId } });
  revalidateQuote(clientId);
}
