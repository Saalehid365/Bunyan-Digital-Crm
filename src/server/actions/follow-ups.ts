"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, canAccessClient, ensureClientMember } from "@/lib/permissions";
import { followUpSchema } from "@/lib/validations/my-day";

/** Radix Select can't carry an empty-string item value, so forms send this sentinel instead. */
function clearSentinel(value: FormDataEntryValue | null) {
  if (value === "none") return undefined;
  return value || undefined;
}

function revalidateFollowUpViews(clientId: string | null | undefined) {
  revalidatePath("/my-day");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function createFollowUp(formData: FormData) {
  const user = await requireUser();
  const parsed = followUpSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes") || "",
    dueDate: formData.get("dueDate") || "",
    clientId: clearSentinel(formData.get("clientId")),
    assignedToId: clearSentinel(formData.get("assignedToId")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (data.clientId && !(await canAccessClient(user, data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const assignedToId = data.assignedToId || user.id;
  const followUp = await prisma.followUp.create({
    data: {
      clientId: data.clientId || undefined,
      assignedToId,
      createdById: user.id,
      title: data.title,
      notes: data.notes || undefined,
      dueDate: new Date(data.dueDate),
    },
  });

  if (data.clientId) await ensureClientMember(data.clientId, assignedToId);

  revalidateFollowUpViews(data.clientId);
  return { id: followUp.id };
}

async function getOwnedFollowUp(user: { id: string; role: "ADMIN" | "MEMBER" }, followUpId: string) {
  const followUp = await prisma.followUp.findUnique({ where: { id: followUpId } });
  if (!followUp) return { error: "Follow-up not found" as const };
  const owns = followUp.assignedToId === user.id || followUp.createdById === user.id || user.role === "ADMIN";
  if (!owns) return { error: "You don't have access to this follow-up." as const };
  return { followUp };
}

export async function toggleFollowUp(followUpId: string) {
  const user = await requireUser();
  const result = await getOwnedFollowUp(user, followUpId);
  if ("error" in result) return { error: result.error };

  const done = !result.followUp.done;
  await prisma.followUp.update({
    where: { id: followUpId },
    data: { done, completedAt: done ? new Date() : null },
  });

  revalidateFollowUpViews(result.followUp.clientId);
  return { ok: true };
}

export async function rescheduleFollowUp(followUpId: string, newDueDate: string) {
  const user = await requireUser();
  const result = await getOwnedFollowUp(user, followUpId);
  if ("error" in result) return { error: result.error };

  await prisma.followUp.update({ where: { id: followUpId }, data: { dueDate: new Date(newDueDate) } });
  revalidateFollowUpViews(result.followUp.clientId);
  return { ok: true };
}

export async function deleteFollowUp(followUpId: string) {
  const user = await requireUser();
  const result = await getOwnedFollowUp(user, followUpId);
  if ("error" in result) return { error: result.error };

  await prisma.followUp.delete({ where: { id: followUpId } });
  revalidateFollowUpViews(result.followUp.clientId);
  return { ok: true };
}
