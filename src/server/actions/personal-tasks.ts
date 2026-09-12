"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { personalTaskSchema } from "@/lib/validations/my-day";

export async function createPersonalTask(formData: FormData) {
  const user = await requireUser();
  const parsed = personalTaskSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes") || "",
    dueDate: formData.get("dueDate") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const task = await prisma.personalTask.create({
    data: {
      userId: user.id,
      title: data.title,
      notes: data.notes || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });

  revalidatePath("/my-day");
  return { id: task.id };
}

export async function togglePersonalTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.personalTask.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };
  if (task.userId !== user.id) return { error: "This isn't your task." };

  const done = !task.done;
  await prisma.personalTask.update({
    where: { id: taskId },
    data: { done, completedAt: done ? new Date() : null },
  });

  revalidatePath("/my-day");
  return { ok: true };
}

export async function deletePersonalTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.personalTask.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };
  if (task.userId !== user.id) return { error: "This isn't your task." };

  await prisma.personalTask.delete({ where: { id: taskId } });
  revalidatePath("/my-day");
  return { ok: true };
}
