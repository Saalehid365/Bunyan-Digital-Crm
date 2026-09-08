"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { setPassword, removePassword } from "@/server/actions/settings";

const initialState: { error?: string; ok?: boolean } = {};

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = await setPassword(formData);
      return result ?? {};
    },
    initialState,
  );
  const [removing, setRemoving] = useState(false);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        {hasPassword ? (
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{hasPassword ? "New password" : "Set a password"}</Label>
            <Input id="newPassword" name="newPassword" type="password" minLength={8} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
          </div>
        </div>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm text-success">Password saved.</p> : null}
        <div className="flex items-center justify-between">
          {hasPassword ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              disabled={removing}
              onClick={async () => {
                setRemoving(true);
                await removePassword();
                setRemoving(false);
              }}
            >
              Turn off password sign-in
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Without a password, you can only sign in with an emailed link.
            </span>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : hasPassword ? "Update password" : "Set password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
