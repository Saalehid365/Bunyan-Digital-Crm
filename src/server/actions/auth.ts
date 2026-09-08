"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { BASE_PATH } from "@/lib/base-path";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  try {
    await signIn("resend", { email, redirectTo: `${BASE_PATH}/dashboard` });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "We couldn't sign you in. Ask an admin to confirm your account exists." };
    }
    throw error;
  }
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: `${BASE_PATH}/dashboard` });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    throw error;
  }
}
