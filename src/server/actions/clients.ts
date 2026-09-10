"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser, requirePermission, canAccessClient } from "@/lib/permissions";
import { clientSchema } from "@/lib/validations/client";
import { DEFAULT_ONBOARDING_CHECKLIST } from "@/lib/constants";

function emptyToUndefined(v: string | undefined) {
  return v && v.trim() !== "" ? v.trim() : undefined;
}

/**
 * Seeds the default onboarding checklist the first time a client becomes Active.
 * No-ops if the client already has onboarding tasks, so re-toggling status never duplicates it.
 */
async function startOnboardingIfNeeded(clientId: string) {
  const existing = await prisma.clientOnboardingTask.findFirst({ where: { clientId } });
  if (existing) return;

  await prisma.clientOnboardingTask.createMany({
    data: DEFAULT_ONBOARDING_CHECKLIST.map((title, i) => ({
      clientId,
      title,
      position: (i + 1) * 1024,
    })),
  });
}

export async function createClient(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");

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
          message: `Client created by ${user.name ?? user.email}`,
          userId: user.id,
        },
      },
      // A member (not a full admin) granted this permission has no standing assignment
      // to a client that didn't exist yet — assign them to what they just made so they
      // retain access to it, consistent with every other permission being scoped to a
      // member's own assigned clients.
      ...(user.role === "MEMBER" ? { members: { create: { userId: user.id } } } : {}),
    },
  });

  if (data.status === "ACTIVE") {
    await startOnboardingIfNeeded(client.id);
  }

  revalidatePath("/clients");
  return { id: client.id };
}

export async function updateClient(clientId: string, formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }

  const before = await prisma.client.findUnique({ where: { id: clientId }, select: { status: true } });

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
          message: `Client details updated by ${user.name ?? user.email}`,
          userId: user.id,
        },
      },
    },
  });

  if (data.status === "ACTIVE" && before?.status !== "ACTIVE") {
    await startOnboardingIfNeeded(clientId);
    await prisma.activity.create({
      data: {
        clientId,
        type: "CLIENT_UPDATED",
        message: "Onboarding checklist started (Lead → Active)",
        userId: user.id,
      },
    });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { ok: true };
}

export async function deleteClient(clientId: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }
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
