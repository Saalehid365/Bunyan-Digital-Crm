"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, canAccessClient } from "@/lib/permissions";
import { timeEntrySchema } from "@/lib/validations/subtask";
import { formatMinutes } from "@/lib/constants";

export async function addTimeEntry(formData: FormData) {
  const user = await requireUser();

  const parsed = timeEntrySchema.safeParse({
    taskId: formData.get("taskId"),
    hours: formData.get("hours") || 0,
    minutes: formData.get("minutes") || 0,
    note: formData.get("note"),
    workDate: formData.get("workDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const totalMinutes = data.hours * 60 + data.minutes;
  if (totalMinutes <= 0) return { error: "Enter a duration greater than 0." };

  const task = await prisma.task.findUnique({ where: { id: data.taskId }, include: { job: true } });
  if (!task) return { error: "Task not found" };
  if (!(await canAccessClient(user, task.job.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.timeEntry.create({
    data: {
      taskId: data.taskId,
      userId: user.id,
      minutes: totalMinutes,
      note: data.note || undefined,
      workDate: new Date(data.workDate),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: task.job.clientId,
      jobId: task.jobId,
      type: "TIME_LOGGED",
      message: `${user.name ?? user.email} logged ${formatMinutes(totalMinutes)} on "${task.title}" (${task.job.title})`,
      userId: user.id,
    },
  });

  revalidatePath(`/clients/${task.job.clientId}/board`);
  revalidatePath("/board");
  revalidatePath(`/clients/${task.job.clientId}/activity`);
  return { ok: true };
}

export async function deleteTimeEntry(timeEntryId: string) {
  const user = await requireUser();
  const entry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    include: { task: { include: { job: true } } },
  });
  if (!entry) return { error: "Entry not found" };
  if (!(await canAccessClient(user, entry.task.job.clientId))) {
    return { error: "You don't have access to this client." };
  }
  if (user.role !== "ADMIN" && entry.userId !== user.id) {
    return { error: "You can only remove your own time entries." };
  }

  await prisma.timeEntry.delete({ where: { id: timeEntryId } });
  revalidatePath(`/clients/${entry.task.job.clientId}/board`);
  revalidatePath("/board");
  return { ok: true };
}
