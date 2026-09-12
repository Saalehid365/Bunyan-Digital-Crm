"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { connectCalendly, disconnectCalendly } from "@/server/actions/calendly";

const initialState: { error?: string; ok?: boolean } = {};

export function CalendlyForm({
  connected,
  name,
  connectedAt,
}: {
  connected: boolean;
  name: string | null;
  connectedAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = await connectCalendly(formData);
      return result ?? {};
    },
    initialState,
  );
  const [removing, setRemoving] = useState(false);

  return (
    <div className="space-y-4">
      {connected ? (
        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Connected as {name || "Calendly account"}</p>
            {connectedAt ? (
              <p className="text-xs text-muted-foreground">
                Since {format(new Date(connectedAt), "d MMM yyyy")}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={removing}
            onClick={async () => {
              setRemoving(true);
              await disconnectCalendly();
              setRemoving(false);
            }}
          >
            Disconnect
          </Button>
        </div>
      ) : null}

      <form action={formAction} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="calendly-token">{connected ? "Update token" : "Personal Access Token"}</Label>
          <Input id="calendly-token" name="token" type="password" placeholder="eyJhbGciOi…" autoComplete="off" />
          <p className="text-xs text-muted-foreground">
            Generate one at calendly.com → Integrations → API & Webhooks.
          </p>
        </div>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm text-success">Calendly connected.</p> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Connecting…" : connected ? "Update" : "Connect"}
          </Button>
        </div>
      </form>
    </div>
  );
}
