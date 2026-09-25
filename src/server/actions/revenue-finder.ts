"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { REVENUE_FINDER_STATUSES } from "@/lib/revenue-finder";

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

  // One transaction so a client never exists without the application pointing at it.
  const client = await prisma.$transaction(async (tx) => {
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
    await tx.revenueFinderApplication.update({
      where: { id },
      data: { clientId: created.id, status: "CONVERTED" },
    });
    return created;
  });

  revalidatePath("/revenue-finder");
  revalidatePath("/clients");
  return { clientId: client.id };
}
