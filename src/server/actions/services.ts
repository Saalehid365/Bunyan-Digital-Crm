"use server";

import { revalidatePath } from "next/cache";
import { addDays, addMonths, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission, canAccessClient } from "@/lib/permissions";
import { serviceTypeSchema, clientServiceSchema } from "@/lib/validations/service";
import { activateClient } from "@/lib/client-activation";

export async function createServiceType(formData: FormData) {
  await requirePermission("MANAGE_SERVICES");
  const parsed = serviceTypeSchema.safeParse({
    name: formData.get("name"),
    colorHex: formData.get("colorHex") || "#E08245",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const existing = await prisma.serviceType.count();
  await prisma.serviceType.create({
    data: { ...parsed.data, order: existing },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function archiveServiceType(serviceTypeId: string) {
  await requirePermission("MANAGE_SERVICES");
  await prisma.serviceType.update({
    where: { id: serviceTypeId },
    data: { isArchived: true },
  });
  revalidatePath("/settings");
}

export async function addClientService(formData: FormData) {
  const user = await requirePermission("MANAGE_SERVICES");
  const parsed = clientServiceSchema.safeParse({
    clientId: formData.get("clientId"),
    serviceTypeId: formData.get("serviceTypeId"),
    label: formData.get("label"),
    status: formData.get("status") || "ACTIVE",
    billingType: formData.get("billingType") || "MONTHLY",
    priceValue: formData.get("priceValue") ?? undefined,
    startDate: formData.get("startDate"),
    notes: formData.get("notes"),
    createInitialInvoice: formData.get("createInitialInvoice") ?? undefined,
    invoiceDueDate: formData.get("invoiceDueDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (!(await canAccessClient(user, data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const wantsInitialInvoice = Boolean(data.createInitialInvoice) && data.billingType === "MONTHLY";
  if (wantsInitialInvoice && !(await hasPermission(user, "MANAGE_BILLING"))) {
    return { error: "You don't have permission to create invoices." };
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();

  const clientService = await prisma.$transaction(async (tx) => {
    const service = await tx.clientService.create({
      data: {
        clientId: data.clientId,
        serviceTypeId: data.serviceTypeId,
        label: data.label || undefined,
        status: data.status,
        billingType: data.billingType,
        priceValue: data.priceValue,
        startDate: data.startDate ? startDate : undefined,
        notes: data.notes || undefined,
        // First auto-invoice is due a month out — the very first bill is either created
        // manually right now (below) or skipped entirely, so automatic billing starts
        // the following cycle rather than double-billing month one.
        nextInvoiceDate: data.billingType === "MONTHLY" ? addMonths(startDate, 1) : undefined,
      },
      include: { serviceType: true },
    });

    if (wantsInitialInvoice) {
      const issueDate = new Date();
      await tx.invoice.create({
        data: {
          clientId: data.clientId,
          title: `${service.serviceType.name}${data.label ? ` — ${data.label}` : ""} — ${format(issueDate, "MMMM yyyy")}`,
          issueDate,
          dueDate: data.invoiceDueDate ? new Date(data.invoiceDueDate) : addDays(issueDate, 14),
          createdById: user.id,
          lineItems: {
            create: [
              {
                clientServiceId: service.id,
                description: data.label || service.serviceType.name,
                quantity: 1,
                unitPrice: data.priceValue ?? 0,
                position: 0,
              },
            ],
          },
          activities: {
            create: {
              clientId: data.clientId,
              type: "CREATED",
              message: `Invoice created for ${service.serviceType.name} by ${user.name ?? user.email}`,
              userId: user.id,
            },
          },
        },
      });
    }

    return service;
  });

  if (data.status === "ACTIVE") {
    await activateClient(
      data.clientId,
      user.id,
      `Client marked Active — ${clientService.serviceType.name} service started`,
    );
  }

  revalidatePath(`/clients/${data.clientId}/services`);
  revalidatePath(`/clients/${data.clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  if (wantsInitialInvoice) {
    revalidatePath("/invoices");
    revalidatePath(`/clients/${data.clientId}/billing`);
    revalidatePath(`/clients/${data.clientId}/activity`);
  }
  return { ok: true };
}

export async function updateClientServiceStatus(
  clientServiceId: string,
  clientId: string,
  status: "ACTIVE" | "PAUSED" | "COMPLETED",
) {
  const user = await requirePermission("MANAGE_SERVICES");
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }

  const existing = await prisma.clientService.findUnique({
    where: { id: clientServiceId },
    select: { status: true, billingType: true, nextInvoiceDate: true },
  });

  // Reactivating a MONTHLY service that's been paused a while: if we left a stale
  // nextInvoiceDate untouched, the cron would fire once, advance it by +1 month from
  // that still-past value, still be due, and fire again the next day — a catch-up
  // storm. Clamp forward to now only if it's null/already past; leave a still-future
  // date alone so a service paused and resumed mid-cycle isn't double-billed.
  const now = new Date();
  const reactivatingMonthly =
    status === "ACTIVE" && existing?.status !== "ACTIVE" && existing?.billingType === "MONTHLY";
  const shouldClamp =
    reactivatingMonthly && (!existing?.nextInvoiceDate || existing.nextInvoiceDate <= now);

  const updated = await prisma.clientService.update({
    where: { id: clientServiceId },
    data: {
      status,
      ...(shouldClamp ? { nextInvoiceDate: now } : {}),
    },
    include: { serviceType: true },
  });

  if (status === "ACTIVE") {
    await activateClient(clientId, user.id, `Client marked Active — ${updated.serviceType.name} service marked active`);
  }

  revalidatePath(`/clients/${clientId}/services`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function updateClientServiceAutoInvoice(
  clientServiceId: string,
  clientId: string,
  autoInvoice: boolean,
) {
  const user = await requirePermission("MANAGE_SERVICES");
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }
  await prisma.clientService.update({
    where: { id: clientServiceId },
    data: { autoInvoice },
  });
  revalidatePath(`/clients/${clientId}/services`);
}

export async function deleteClientService(clientServiceId: string, clientId: string) {
  const user = await requirePermission("MANAGE_SERVICES");
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }
  await prisma.clientService.delete({ where: { id: clientServiceId } });
  revalidatePath(`/clients/${clientId}/services`);
  revalidatePath("/dashboard");
}
