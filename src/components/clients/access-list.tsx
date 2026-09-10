"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Copy, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AccessFormDialog } from "@/components/clients/access-form-dialog";
import { revealClientAccessSecret, deleteClientAccess } from "@/server/actions/access";

type ClientAccessEntry = {
  id: string;
  label: string;
  username: string | null;
  url: string | null;
  notes: string | null;
};

function SecretCell({ accessId }: { accessId: string }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggleReveal() {
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    const result = await revealClientAccessSecret(accessId);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setRevealed(result?.secret ?? "");
  }

  async function copy() {
    const result = await revealClientAccessSecret(accessId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    if (!result?.secret) {
      toast.error("No password saved for this entry.");
      return;
    }
    await navigator.clipboard.writeText(result.secret);
    toast.success("Password copied");
  }

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-sm text-foreground">{revealed !== null ? revealed || "—" : "••••••••"}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground"
        disabled={loading}
        onClick={toggleReveal}
      >
        {revealed !== null ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={copy}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function AccessList({
  clientId,
  entries,
  canManageClients,
}: {
  clientId: string;
  entries: ClientAccessEntry[];
  canManageClients: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} className="space-y-2 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">{entry.label}</span>
              {entry.url ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
            {canManageClients ? (
              <div className="flex items-center gap-1">
                <AccessFormDialog clientId={clientId} access={entry} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteClientAccess(entry.id).then(() => {}))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Username</span>
              <span className="font-mono text-sm text-foreground">{entry.username || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Password</span>
              <SecretCell accessId={entry.id} />
            </div>
          </div>
          {entry.notes ? <p className="text-sm text-muted-foreground">{entry.notes}</p> : null}
        </li>
      ))}
    </ul>
  );
}
