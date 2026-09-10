import { prisma } from "@/lib/prisma";
import { DEFAULT_ONBOARDING_CHECKLIST } from "@/lib/constants";

/**
 * Seeds the default onboarding checklist the first time a client becomes Active.
 * No-ops if the client already has onboarding tasks, so this is safe to call repeatedly.
 */
export async function startOnboardingIfNeeded(clientId: string) {
  const existing = await prisma.clientOnboardingTask.findFirst({ where: { clientId } });
  if (existing) return;

  await prisma.clientOnboardingTask.createMany({
    data: DEFAULT_ONBOARDING_CHECKLIST.map((title, i) => ({
      clientId,
      title,
      position: (i + 1) * 1024,
    })),
  });
}

/**
 * Marks a client Active and starts onboarding, if they aren't Active already.
 * Called whenever a client gets a real signal of activity — an explicit status
 * edit, or their first active service — not just from the client detail form.
 */
export async function activateClient(clientId: string, userId: string, message: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { status: true } });
  if (!client || client.status === "ACTIVE") return;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      status: "ACTIVE",
      activities: { create: { type: "CLIENT_UPDATED", message, userId } },
    },
  });

  await startOnboardingIfNeeded(clientId);
}
