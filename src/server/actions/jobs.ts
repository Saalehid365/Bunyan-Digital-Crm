"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, canAccessClient } from "@/lib/permissions";
import { jobSchema, moveJobSchema, jobStageEnum } from "@/lib/validations/job";
import { JOB_STAGE_LABEL } from "@/lib/constants";

/** Radix Select can't carry an empty-string item value, so forms send these sentinels instead. */
function clearSentinel(value: FormDataEntryValue | null) {
  if (value === "unassigned" || value === "none") return undefined;
  return value || undefined;
}

export async function createJob(formData: FormData) {
  const user = await requireUser();

  const parsed = jobSchema.safeParse({
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

  const stageParsed = jobStageEnum.safeParse(formData.get("stage"));
  const stage = stageParsed.success ? stageParsed.data : "BACKLOG";

  const last = await prisma.job.findFirst({
    where: { clientId: data.clientId, stage },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const job = await prisma.job.create({
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
          message: `Job "${data.title}" created by ${user.name ?? user.email}`,
          userId: user.id,
        },
      },
    },
  });

  revalidatePath(`/clients/${data.clientId}/board`);
  revalidatePath("/board");
  revalidatePath(`/clients/${data.clientId}/activity`);
  return { id: job.id };
}

export async function moveJobStage(input: unknown) {
  const user = await requireUser();
  const parsed = moveJobSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid move" };
  const { jobId, stage, position } = parsed.data;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { error: "Job not found" };
  if (!(await canAccessClient(user, job.clientId))) {
    return { error: "You don't have access to this client." };
  }

  const stageChanged = job.stage !== stage;

  await prisma.job.update({
    where: { id: jobId },
    data: {
      stage,
      position,
      completedAt: stage === "DONE" ? (job.completedAt ?? new Date()) : null,
    },
  });

  if (stageChanged) {
    await prisma.activity.create({
      data: {
        clientId: job.clientId,
        jobId: job.id,
        type: stage === "DONE" ? "COMPLETED" : "STAGE_CHANGE",
        message: `"${job.title}" moved to ${JOB_STAGE_LABEL[stage]} by ${user.name ?? user.email}`,
        userId: user.id,
      },
    });
  }

  revalidatePath(`/clients/${job.clientId}/board`);
  revalidatePath("/board");
  revalidatePath(`/clients/${job.clientId}/activity`);
  return { ok: true };
}

export async function updateJob(jobId: string, formData: FormData) {
  const user = await requireUser();

  const parsed = jobSchema.safeParse({
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

  await prisma.job.update({
    where: { id: jobId },
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

export async function deleteJob(jobId: string, clientId: string) {
  const user = await requireUser();
  if (!(await canAccessClient(user, clientId))) {
    return { error: "You don't have access to this client." };
  }
  await prisma.job.delete({ where: { id: jobId } });
  revalidatePath(`/clients/${clientId}/board`);
  revalidatePath("/board");
}
