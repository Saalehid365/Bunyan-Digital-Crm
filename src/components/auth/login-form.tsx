"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInWithEmail, signInWithPassword } from "@/server/actions/auth";

const initialState: { error?: string } = {};

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "link">("password");

  const [linkState, linkAction, linkPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = await signInWithEmail(formData);
      return result ?? {};
    },
    initialState,
  );

  const [pwState, pwAction, pwPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = await signInWithPassword(formData);
      return result ?? {};
    },
    initialState,
  );

  if (mode === "link") {
    return (
      <div className="space-y-4">
        <form action={linkAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-email">Work email</Label>
            <Input
              id="link-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@bunyandigital.co"
              required
            />
          </div>
          {linkState?.error ? <p className="text-sm text-destructive">{linkState.error}</p> : null}
          <Button type="submit" className="w-full" disabled={linkPending}>
            {linkPending ? "Sending link…" : "Send sign-in link"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode("password")}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Sign in with a password instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={pwAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@bunyandigital.co"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {pwState?.error ? <p className="text-sm text-destructive">{pwState.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pwPending}>
          {pwPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => setMode("link")}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Email me a one-time sign-in link instead
      </button>
    </div>
  );
}
