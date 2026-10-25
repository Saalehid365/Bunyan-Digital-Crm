"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Users, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { invitePortalTeammate, setPortalTeammateDisabled, removePortalTeammate } from "@/server/actions/portal-actions";

type Teammate = { id: string; name: string; email: string; disabledAt: string | null; lastLoginAt: string | null };

const initial: { error?: string; ok?: boolean } = {};

function InviteForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await invitePortalTeammate(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) {
      setOpen(false);
      toast.success("Invited — they'll get an email with their sign-in details");
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add someone
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3 rounded-lg border border-white/10 bg-card/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="teammate-name">Name</Label>
          <Input id="teammate-name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teammate-email">Email</Label>
          <Input id="teammate-email" name="email" type="email" required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        They&apos;ll get an email with a sign-in link and a temporary password, and will see everything you see.
      </p>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Inviting…" : "Send invite"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function PortalTeamView({ currentUserId, teammates }: { currentUserId: string; teammates: Teammate[] }) {
  async function toggleDisabled(id: string, disabled: boolean) {
    const result = await setPortalTeammateDisabled(id, disabled);
    if (result?.error) toast.error(result.error);
  }
  async function remove(id: string) {
    const result = await removePortalTeammate(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Removed");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-muted-foreground" />
          Portal access
        </CardTitle>
        <InviteForm />
      </CardHeader>
      <CardContent>
        {teammates.length === 0 ? (
          <EmptyState icon={Users} title="Just you so far" description="Add a colleague so they can see results and reply to messages too." />
        ) : (
          <ul className="divide-y divide-white/10">
            {teammates.map((t) => {
              const isYou = t.id === currentUserId;
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {t.name}
                      {isYou ? <Badge variant="secondary">You</Badge> : null}
                      {t.disabledAt ? <Badge variant="secondary">Disabled</Badge> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.email} &middot; {t.lastLoginAt ? `last in ${format(new Date(t.lastLoginAt), "d MMM yyyy")}` : "hasn't signed in yet"}
                    </p>
                  </div>
                  {!isYou ? (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleDisabled(t.id, !t.disabledAt)}>
                        {t.disabledAt ? "Enable" : "Disable"}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => remove(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
