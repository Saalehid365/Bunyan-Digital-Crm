"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { hashPassword, verifyPassword } from "@/lib/password";

const passwordSchema = z
  .object({
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function setPassword(formData: FormData) {
  const user = await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (!existing) return { error: "Account not found." };

  // If a password is already set, require the current one before changing it.
  if (existing.passwordHash) {
    if (!parsed.data.currentPassword || !verifyPassword(parsed.data.currentPassword, existing.passwordHash)) {
      return { error: "Current password is incorrect." };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.newPassword) },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function removePassword() {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: null } });
  revalidatePath("/settings");
}
