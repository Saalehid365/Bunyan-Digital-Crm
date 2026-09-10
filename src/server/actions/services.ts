"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, canAccessClient } from "@/lib/permissions";
import { serviceTypeSchema, clientServiceSchema } from "@/lib/validations/service";

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
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (!(await canAccessClient(user, data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.clientService.create({
    data: {
      clientId: data.clientId,
      serviceTypeId: data.serviceTypeId,
      label: data.label || undefined,
      status: data.status,
      billingType: data.billingType,
      priceValue: data.priceValue,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      notes: data.notes || undefined,
    },
  });

  revalidatePath(`/clients/${data.clientId}/services`);
  revalidatePath(`/clients/${data.clientId}`);
  revalidatePath("/dashboard");
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
  await prisma.clientService.update({
    where: { id: clientServiceId },
    data: { status },
  });
  revalidatePath(`/clients/${clientId}/services`);
  revalidatePath("/dashboard");
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
