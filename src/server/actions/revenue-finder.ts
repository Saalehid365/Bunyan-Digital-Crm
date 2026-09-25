"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { requireAdmin, ensureClientMember } from "@/lib/permissions";
import { REVENUE_FINDER_STATUSES, REVENUE_FINDER_SERVICE_NAME, REVENUE_FINDER_SPRINT_TASKS } from "@/lib/revenue-finder";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(REVENUE_FINDER_STATUSES as [string, ...string[]]),
  internalNotes: z.string().trim().max(4000),
});

export async function updateRevenueFinderApplication(input: {
  id: string;
  status: string;
  internalNotes: string;
}) {
  await requireAdmin();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  await prisma.revenueFinderApplication.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status as (typeof REVENUE_FINDER_STATUSES)[number],
      internalNotes: parsed.data.internalNotes || null,
    },
  });
  revalidatePath("/revenue-finder");
  return { ok: true };
}

export async function convertRevenueFinderToClient(id: string) {
  const user = await requireAdmin();
  const app = await prisma.revenueFinderApplication.findUnique({ where: { id } });
  if (!app) return { error: "Application not found" };
  if (app.clientId) return { error: "Already converted", clientId: app.clientId };

  const summary = [
    "From the 7-Day Revenue Finder application.",
    `Store: ${app.storeUrl}`,
    `Platform: ${app.platform} · Market: ${app.market}`,
    `Monthly size: ${app.monthlySize}`,
    `Role: ${app.role}`,
    `Decision-maker on the call: ${app.decisionMakerOnCall ? "Yes" : "No"} · Access within 48h: ${app.accessWithin48h ? "Yes" : "No"}`,
    app.notes ? `Notes: ${app.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // The work starts with the Director; they reassign it to someone else from the board.
  // Falls back to whoever is converting if no active user is named "Director".
  const director =
    (await prisma.user.findFirst({
      where: { name: { equals: "Director", mode: "insensitive" }, disabledAt: null },
      select: { id: true },
    })) ?? { id: user.id };

  // One transaction so a client never exists without its service, job and the application link.
  const client = await prisma.$transaction(async (tx) => {
    const serviceType =
      (await tx.serviceType.findUnique({ where: { name: REVENUE_FINDER_SERVICE_NAME } })) ??
      (await tx.serviceType.create({
        data: {
          name: REVENUE_FINDER_SERVICE_NAME,
          colorHex: "#2323ff",
          order: ((await tx.serviceType.aggregate({ _max: { order: true } }))._max.order ?? 0) + 1,
        },
      }));
    const created = await tx.client.create({
      data: {
        name: app.name,
        contactName: app.name,
        contactEmail: app.email,
        contactPhone: app.phone,
        status: "LEAD",
        notes: summary,
        activities: {
          create: {
            type: "CREATED",
            message: `Client created from Revenue Finder application by ${user.name ?? user.email}`,
            userId: user.id,
          },
        },
      },
    });
    const service = await tx.clientService.create({
      data: {
        clientId: created.id,
        serviceTypeId: serviceType.id,
        status: "ACTIVE",
        billingType: "ONE_OFF",
        priceValue: 0,
        startDate: new Date(),
        notes: "Free 7-day Revenue Finder sprint.",
      },
    });
    await tx.job.create({
      data: {
        clientId: created.id,
        clientServiceId: service.id,
        title: `${REVENUE_FINDER_SERVICE_NAME} — ${app.storeUrl.replace(/^https?:\/\//, "")}`.slice(0, 200),
        description: summary,
        stage: "BACKLOG",
        priority: "MEDIUM",
        assignedToId: director.id,
        dueDate: addDays(new Date(), 7),
        position: 1024,
        tasks: {
          create: REVENUE_FINDER_SPRINT_TASKS.map((t, i) => ({ ...t, position: (i + 1) * 1024 })),
        },
        activities: {
          create: {
            clientId: created.id,
            type: "CREATED",
            message: `Job created from Revenue Finder application by ${user.name ?? user.email}`,
            userId: user.id,
          },
        },
      },
    });
    await tx.revenueFinderApplication.update({
      where: { id },
      data: { clientId: created.id, status: "CONVERTED" },
    });
    return created;
  });

  await ensureClientMember(client.id, director.id);

  revalidatePath("/revenue-finder");
  revalidatePath("/clients");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { clientId: client.id };
}
