"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { hashPassword } from "@/lib/password";
import { inviteUserSchema, roleEnum, permissionsInputSchema } from "@/lib/validations/team";

export async function inviteUser(formData: FormData) {
  await requireAdmin();

  const parsed = inviteUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "A user with that email already exists." };

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash: hashPassword(data.password),
    },
  });

  revalidatePath("/team");
  return { ok: true };
}

export async function setUserRole(userId: string, role: string) {
  await requireAdmin();
  const parsed = roleEnum.safeParse(role);
  if (!parsed.success) return { error: "Invalid role" };
  await prisma.user.update({ where: { id: userId }, data: { role: parsed.data } });
  revalidatePath("/team");
}

export async function setUserPermissions(userId: string, permissions: string[]) {
  await requireAdmin();
  const parsed = permissionsInputSchema.safeParse(permissions);
  if (!parsed.success) return { error: "Invalid permissions" };
  await prisma.user.update({ where: { id: userId }, data: { permissions: parsed.data } });
  revalidatePath("/team");
}

export async function setUserPassword(userId: string, password: string) {
  await requireAdmin();
  if (password.length < 8) return { error: "Use at least 8 characters" };
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(password) } });
  revalidatePath("/team");
  return { ok: true };
}

export async function setUserDisabled(userId: string, disabled: boolean) {
  const admin = await requireAdmin();
  if (admin.id === userId) return { error: "You can't disable your own account." };
  await prisma.user.update({
    where: { id: userId },
    data: { disabledAt: disabled ? new Date() : null },
  });
  revalidatePath("/team");
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return { error: "You can't remove your own account." };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { error: "User not found" };

  if (target.role === "ADMIN") {
    const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", id: { not: userId } } });
    if (otherAdmins === 0) return { error: "You can't remove the only admin." };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/team");
  return { ok: true };
}
