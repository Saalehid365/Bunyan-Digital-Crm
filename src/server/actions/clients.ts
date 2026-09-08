"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser, canAccessClient } from "@/lib/permissions";
import { clientSchema } from "@/lib/validations/client";

function emptyToUndefined(v: string | undefined) {
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export async function createClient(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    status: formData.get("status") || "LEAD",
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const client = await prisma.client.create({
    data: {
      name: data.name,
      companyName: emptyToUndefined(data.companyName),
      contactName: emptyToUndefined(data.contactName),
      contactEmail: emptyToUndefined(data.contactEmail),
      contactPhone: emptyToUndefined(data.contactPhone),
      status: data.status,
      notes: emptyToUndefined(data.notes),
      activities: {
        create: {
          type: "CREATED",
          message: `Client created by ${admin.name ?? admin.email}`,
          userId: admin.id,
        },
      },
    },
  });

  revalidatePath("/clients");
  return { id: client.id };
}

export async function updateClient(clientId: string, formData: FormData) {
  const admin = await requireAdmin();

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    status: formData.get("status") || "LEAD",
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name,
      companyName: emptyToUndefined(data.companyName),
      contactName: emptyToUndefined(data.contactName),
      contactEmail: emptyToUndefined(data.contactEmail),
      contactPhone: emptyToUndefined(data.contactPhone),
      status: data.status,
      notes: emptyToUndefined(data.notes),
      activities: {
        create: {
          type: "CLIENT_UPDATED",
          message: `Client details updated by ${admin.name ?? admin.email}`,
          userId: admin.id,
        },
      },
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { ok: true };
}

export async function deleteClient(clientId: string) {
  await requireAdmin();
  try {
    await prisma.client.delete({ where: { id: clientId } });
  } catch {
    return { error: "Couldn't delete this client. Try again." };
  }
  revalidatePath("/clients");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function assignMember(clientId: string, userId: string) {
  await requireAdmin();
  await prisma.clientMember.upsert({
    where: { clientId_userId: { clientId, userId } },
    create: { clientId, userId },
    update: {},
  });
  revalidatePath(`/clients/${clientId}`);
}

export async function unassignMember(clientId: string, userId: string) {
  await requireAdmin();
  await prisma.clientMember.deleteMany({ where: { clientId, userId } });
  revalidatePath(`/clients/${clientId}`);
}

export async function addClientNote(clientId: string, message: string) {
  const user = await requireUser();
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }
  const trimmed = message.trim();
  if (!trimmed) return { error: "Note can't be empty." };

  await prisma.activity.create({
    data: {
      clientId,
      type: "NOTE",
      message: trimmed,
      userId: user.id,
    },
  });
  revalidatePath(`/clients/${clientId}/activity`);
  return { ok: true };
}
