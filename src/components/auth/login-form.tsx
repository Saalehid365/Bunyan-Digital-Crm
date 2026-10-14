"use client";

import { useState } from "react";
import { LoginForm as GlassLoginForm } from "@/components/ui/login-form";
import { signInWithEmail, signInWithPassword } from "@/server/actions/auth";

const toggleClass = "w-full text-center text-xs text-[#b8bfcc] transition hover:text-white";

export function LoginForm({ initialError = null }: { initialError?: string | null }) {
  const [mode, setMode] = useState<"password" | "link">("password");

  if (mode === "link") {
    return (
      <GlassLoginForm
        key="link"
        action={signInWithEmail}
        title="Team sign in"
        subtitle="We'll email you a one-time sign-in link."
        emailLabel="Work email"
        showPassword={false}
        submitLabel="Send sign-in link"
        pendingLabel="Sending link…"
        afterForm={
          <button type="button" onClick={() => setMode("password")} className={toggleClass}>
            Sign in with a password instead
          </button>
        }
      />
    );
  }

  return (
    <GlassLoginForm
      key="password"
      action={signInWithPassword}
      title="Team sign in"
      subtitle="Access is by invitation only."
      emailLabel="Work email"
      initialError={initialError}
      afterForm={
        <button type="button" onClick={() => setMode("link")} className={toggleClass}>
          Email me a one-time sign-in link instead
        </button>
      }
    />
  );
}
