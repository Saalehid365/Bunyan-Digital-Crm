"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { encryptSecret } from "@/lib/crypto";
import { fetchCalendlyCurrentUser } from "@/lib/calendly";

export async function connectCalendly(formData: FormData) {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { error: "Paste your Calendly Personal Access Token." };

  const result = await fetchCalendlyCurrentUser(token);
  if (!result.ok) return { error: result.error };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      calendlyTokenCipher: encryptSecret(token),
      calendlyUserUri: result.data.uri,
      calendlyName: result.data.name,
      calendlyConnectedAt: new Date(),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/my-day");
  return { ok: true };
}

export async function disconnectCalendly() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { calendlyTokenCipher: null, calendlyUserUri: null, calendlyName: null, calendlyConnectedAt: null },
  });
  revalidatePath("/settings");
  revalidatePath("/my-day");
}
