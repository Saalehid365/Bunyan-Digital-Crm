"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { BASE_PATH } from "@/lib/base-path";
import { AccountDisabledError } from "@/lib/auth-errors";

const DISABLED_MESSAGE = "This account has been disabled. Ask an admin to restore access.";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  try {
    await signIn("resend", { email, redirectTo: `${BASE_PATH}/dashboard` });
  } catch (error) {
    // Auth.js unconditionally wraps any error thrown inside the email flow's signIn
    // callback as `new AccessDenied(originalError)` (@auth/core/lib/actions/signin/
    // send-token.js), so our AccountDisabledError never surfaces as itself here — it's
    // preserved as `.cause.err` on the wrapping AccessDenied instead. Unwrap one level.
    const cause = (error as { cause?: { err?: unknown } } | undefined)?.cause?.err;
    if (error instanceof AccountDisabledError || cause instanceof AccountDisabledError) {
      return { error: DISABLED_MESSAGE };
    }
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
    if (error instanceof AccountDisabledError) {
      return { error: DISABLED_MESSAGE };
    }
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    throw error;
  }
}
