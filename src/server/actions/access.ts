"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission, canAccessClient } from "@/lib/permissions";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { clientAccessSchema } from "@/lib/validations/access";

function emptyToUndefined(v: string | undefined) {
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export async function addClientAccess(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const parsed = clientAccessSchema.safeParse({
    clientId: formData.get("clientId"),
    label: formData.get("label"),
    username: formData.get("username"),
    secret: formData.get("secret"),
    url: formData.get("url"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (!(await canAccessClient(user, data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.clientAccess.create({
    data: {
      clientId: data.clientId,
      label: data.label,
      username: emptyToUndefined(data.username),
      secretCipher: encryptSecret(data.secret?.trim() ?? ""),
      url: emptyToUndefined(data.url),
      notes: emptyToUndefined(data.notes),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: data.clientId,
      type: "CLIENT_UPDATED",
      message: `${user.name ?? user.email} added access details for "${data.label}"`,
      userId: user.id,
    },
  });

  revalidatePath(`/clients/${data.clientId}/access`);
  return { ok: true };
}

export async function updateClientAccess(accessId: string, formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const existing = await prisma.clientAccess.findUnique({ where: { id: accessId } });
  if (!existing) return { error: "Not found" };
  if (!(await canAccessClient(user, existing.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const parsed = clientAccessSchema.safeParse({
    clientId: existing.clientId,
    label: formData.get("label"),
    username: formData.get("username"),
    secret: formData.get("secret"),
    url: formData.get("url"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  // Leaving the secret field blank on edit keeps the currently stored one.
  const secretCipher = data.secret?.trim() ? encryptSecret(data.secret.trim()) : existing.secretCipher;

  await prisma.clientAccess.update({
    where: { id: accessId },
    data: {
      label: data.label,
      username: emptyToUndefined(data.username),
      secretCipher,
      url: emptyToUndefined(data.url),
      notes: emptyToUndefined(data.notes),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: existing.clientId,
      type: "CLIENT_UPDATED",
      message: `${user.name ?? user.email} updated access details for "${data.label}"`,
      userId: user.id,
    },
  });

  revalidatePath(`/clients/${existing.clientId}/access`);
  return { ok: true };
}

export async function deleteClientAccess(accessId: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const existing = await prisma.clientAccess.findUnique({ where: { id: accessId } });
  if (!existing) return { error: "Not found" };
  if (!(await canAccessClient(user, existing.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.clientAccess.delete({ where: { id: accessId } });

  await prisma.activity.create({
    data: {
      clientId: existing.clientId,
      type: "CLIENT_UPDATED",
      message: `${user.name ?? user.email} removed access details for "${existing.label}"`,
      userId: user.id,
    },
  });

  revalidatePath(`/clients/${existing.clientId}/access`);
  return { ok: true };
}

/** Decrypts one access entry's secret on demand. Never shipped as part of the page's initial render. */
export async function revealClientAccessSecret(accessId: string) {
  const user = await requireUser();
  const existing = await prisma.clientAccess.findUnique({ where: { id: accessId } });
  if (!existing) return { error: "Not found" };
  if (!(await canAccessClient(user, existing.clientId))) {
    return { error: "You don't have access to this client." };
  }
  return { secret: decryptSecret(existing.secretCipher) };
}
