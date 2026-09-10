"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, canAccessClient } from "@/lib/permissions";
import { onboardingTaskSchema } from "@/lib/validations/onboarding";

export async function addOnboardingTask(formData: FormData) {
  const user = await requireUser();
  const parsed = onboardingTaskSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!(await canAccessClient(user, parsed.data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const last = await prisma.clientOnboardingTask.findFirst({
    where: { clientId: parsed.data.clientId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await prisma.clientOnboardingTask.create({
    data: {
      clientId: parsed.data.clientId,
      title: parsed.data.title,
      position: (last?.position ?? 0) + 1024,
    },
  });

  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { id: task.id };
}

export async function toggleOnboardingTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.clientOnboardingTask.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };
  if (!(await canAccessClient(user, task.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const done = !task.done;
  await prisma.clientOnboardingTask.update({
    where: { id: taskId },
    data: { done, completedAt: done ? new Date() : null },
  });

  revalidatePath(`/clients/${task.clientId}`);
  return { ok: true };
}

export async function deleteOnboardingTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.clientOnboardingTask.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };
  if (!(await canAccessClient(user, task.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.clientOnboardingTask.delete({ where: { id: taskId } });
  revalidatePath(`/clients/${task.clientId}`);
  return { ok: true };
}
