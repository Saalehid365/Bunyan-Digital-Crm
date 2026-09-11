"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, canAccessClient } from "@/lib/permissions";
import { taskSchema } from "@/lib/validations/subtask";

async function getJobOrDenied(user: { id: string; role: "ADMIN" | "MEMBER" }, jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { error: "Job not found" as const };
  if (!(await canAccessClient(user, job.clientId))) {
    return { error: "You don't have access to this client." as const };
  }
  return { job };
}

function revalidateJobViews(clientId: string) {
  revalidatePath(`/clients/${clientId}/board`);
  revalidatePath("/board");
  revalidatePath(`/clients/${clientId}/activity`);
}

export async function addTask(formData: FormData) {
  const user = await requireUser();
  const parsed = taskSchema.safeParse({
    jobId: formData.get("jobId"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const result = await getJobOrDenied(user, parsed.data.jobId);
  if ("error" in result) return { error: result.error };

  const last = await prisma.task.findFirst({
    where: { jobId: parsed.data.jobId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      jobId: parsed.data.jobId,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || undefined,
      position: (last?.position ?? 0) + 1024,
    },
  });

  revalidateJobViews(result.job.clientId);
  return { id: task.id };
}

export async function toggleTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { job: true } });
  if (!task) return { error: "Task not found" };
  if (!(await canAccessClient(user, task.job.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const done = !task.done;
  await prisma.task.update({
    where: { id: taskId },
    data: { done, completedAt: done ? new Date() : null },
  });

  if (done) {
    await prisma.activity.create({
      data: {
        clientId: task.job.clientId,
        jobId: task.jobId,
        type: "COMPLETED",
        message: `${user.name ?? user.email} completed "${task.title}" (${task.job.title})`,
        userId: user.id,
      },
    });
  }

  revalidateJobViews(task.job.clientId);
  return { ok: true };
}

export async function renameTask(taskId: string, title: string) {
  const user = await requireUser();
  const trimmed = title.trim();
  if (!trimmed) return { error: "Title can't be empty." };

  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { job: true } });
  if (!task) return { error: "Task not found" };
  if (!(await canAccessClient(user, task.job.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.task.update({ where: { id: taskId }, data: { title: trimmed } });
  revalidateJobViews(task.job.clientId);
  return { ok: true };
}

export async function updateTaskDescription(taskId: string, description: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { job: true } });
  if (!task) return { error: "Task not found" };
  if (!(await canAccessClient(user, task.job.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { description: description.trim() || null },
  });
  revalidateJobViews(task.job.clientId);
  return { ok: true };
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { job: true } });
  if (!task) return { error: "Task not found" };
  if (!(await canAccessClient(user, task.job.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.task.delete({ where: { id: taskId } });
  revalidateJobViews(task.job.clientId);
  return { ok: true };
}
