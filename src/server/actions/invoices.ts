"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, canAccessClient } from "@/lib/permissions";
import { invoiceSchema, invoiceStatusEnum } from "@/lib/validations/invoice";
import { INVOICE_STATUS_LABEL } from "@/lib/constants";

function revalidateInvoice(clientId: string) {
  revalidatePath("/invoices");
  revalidatePath(`/clients/${clientId}/billing`);
  revalidatePath(`/clients/${clientId}/activity`);
  revalidatePath("/dashboard");
}

export async function createInvoice(formData: FormData) {
  const user = await requireAdmin();

  const parsed = invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes"),
    lineItemsJson: formData.get("lineItemsJson"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (!(await canAccessClient(user, data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const invoice = await prisma.invoice.create({
    data: {
      clientId: data.clientId,
      title: data.title,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
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
          message: `Invoice "${data.title}" created by ${user.name ?? user.email}`,
          userId: user.id,
        },
      },
    },
  });

  revalidateInvoice(data.clientId);
  return { id: invoice.id };
}

export async function updateInvoiceStatus(invoiceId: string, status: unknown) {
  const user = await requireAdmin();
  const parsedStatus = invoiceStatusEnum.safeParse(status);
  if (!parsedStatus.success) return { error: "Invalid status" };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { error: "Invoice not found" };
  if (!(await canAccessClient(user, invoice.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: parsedStatus.data,
      paidAt: parsedStatus.data === "PAID" ? (invoice.paidAt ?? new Date()) : invoice.paidAt,
    },
  });

  if (invoice.status !== parsedStatus.data) {
    await prisma.activity.create({
      data: {
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        type: "INVOICE_STATUS_CHANGE",
        message: `Invoice "${invoice.title}" moved to ${INVOICE_STATUS_LABEL[parsedStatus.data]} by ${user.name ?? user.email}`,
        userId: user.id,
      },
    });
  }

  revalidateInvoice(invoice.clientId);
  return { ok: true };
}

export async function deleteInvoice(invoiceId: string, clientId: string) {
  const user = await requireAdmin();
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidateInvoice(clientId);
}
