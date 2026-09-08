"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, canAccessClient } from "@/lib/permissions";
import { taskSchema, moveTaskSchema, taskStageEnum } from "@/lib/validations/task";
import { TASK_STAGE_LABEL } from "@/lib/constants";

/** Radix Select can't carry an empty-string item value, so forms send these sentinels instead. */
function clearSentinel(value: FormDataEntryValue | null) {
  if (value === "unassigned" || value === "none") return undefined;
  return value || undefined;
}

export async function createTask(formData: FormData) {
  const user = await requireUser();

  const parsed = taskSchema.safeParse({
    clientId: formData.get("clientId"),
    clientServiceId: clearSentinel(formData.get("clientServiceId")),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority") || "MEDIUM",
    assignedToId: clearSentinel(formData.get("assignedToId")),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (!(await canAccessClient(user, data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const stageParsed = taskStageEnum.safeParse(formData.get("stage"));
  const stage = stageParsed.success ? stageParsed.data : "BACKLOG";

  const last = await prisma.task.findFirst({
    where: { clientId: data.clientId, stage },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      clientId: data.clientId,
      clientServiceId: data.clientServiceId || undefined,
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      assignedToId: data.assignedToId || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      stage,
      position: (last?.position ?? 0) + 1024,
      activities: {
        create: {
          clientId: data.clientId,
          type: "CREATED",
          message: `Task "${data.title}" created by ${user.name ?? user.email}`,
          userId: user.id,
        },
      },
    },
  });

  revalidatePath(`/clients/${data.clientId}/board`);
  revalidatePath("/board");
  revalidatePath(`/clients/${data.clientId}/activity`);
  return { id: task.id };
}

export async function moveTaskStage(input: unknown) {
  const user = await requireUser();
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid move" };
  const { taskId, stage, position } = parsed.data;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };
  if (!(await canAccessClient(user, task.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const stageChanged = task.stage !== stage;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      stage,
      position,
      completedAt: stage === "DONE" ? (task.completedAt ?? new Date()) : null,
    },
  });

  if (stageChanged) {
    await prisma.activity.create({
      data: {
        clientId: task.clientId,
        taskId: task.id,
        type: stage === "DONE" ? "COMPLETED" : "STAGE_CHANGE",
        message: `"${task.title}" moved to ${TASK_STAGE_LABEL[stage]} by ${user.name ?? user.email}`,
        userId: user.id,
      },
    });
  }

  revalidatePath(`/clients/${task.clientId}/board`);
  revalidatePath("/board");
  revalidatePath(`/clients/${task.clientId}/activity`);
  return { ok: true };
}

export async function updateTask(taskId: string, formData: FormData) {
  const user = await requireUser();

  const parsed = taskSchema.safeParse({
    clientId: formData.get("clientId"),
    clientServiceId: clearSentinel(formData.get("clientServiceId")),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority") || "MEDIUM",
    assignedToId: clearSentinel(formData.get("assignedToId")),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (!(await canAccessClient(user, data.clientId))) {
    return { error: "You don't have access to this client." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      clientServiceId: data.clientServiceId || null,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      assignedToId: data.assignedToId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  revalidatePath(`/clients/${data.clientId}/board`);
  revalidatePath("/board");
  return { ok: true };
}

export async function deleteTask(taskId: string, clientId: string) {
  const user = await requireUser();
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/clients/${clientId}/board`);
  revalidatePath("/board");
}
