"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createPortalSession, destroyPortalSession } from "@/lib/portal-auth";

const GENERIC_ERROR = "Incorrect email or password.";
const DISABLED_ERROR = "This account has been disabled. Ask your account manager for access.";

export async function portalSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const user = await prisma.clientPortalUser.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) return { error: GENERIC_ERROR };
  if (user.disabledAt) return { error: DISABLED_ERROR };

  await prisma.clientPortalUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createPortalSession(user.id);
  redirect("/portal");
}

export async function portalSignOut() {
  await destroyPortalSession();
  redirect("/portal/login");
}
