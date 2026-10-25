"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import {
  createPortalUser,
  setPortalUserPassword,
  setPortalUserDisabled,
  deletePortalUser,
} from "@/server/actions/client-portal";

export type PortalUserRow = { id: string; name: string; email: string; disabledAt: string | null; lastLoginAt: string | null };

const initial: { error?: string; ok?: boolean } = {};

function CreateDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await createPortalUser(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add teammate
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a teammate to this client’s portal</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="space-y-2">
            <Label htmlFor="pu-name">Name</Label>
            <Input id="pu-name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pu-email">Email</Label>
            <Input id="pu-email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pu-password">Password</Label>
            <Input id="pu-password" name="password" minLength={8} required />
          </div>
          <p className="text-xs text-muted-foreground">
            No email is sent — share this password with them yourself so they can sign in at /portal/login.
          </p>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Adding…" : "Add teammate"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ clientId, portalUserId }: { clientId: string; portalUserId: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const result = await setPortalUserPassword(portalUserId, clientId, password);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Password reset");
    setOpen(false);
    setPassword("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Reset password</Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-pw">New password</Label>
            <Input id="reset-pw" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
          </div>
          <Button className="w-full" disabled={pending || password.length < 8} onClick={submit}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PortalAccessSection({ clientId, users, canManage }: { clientId: string; users: PortalUserRow[]; canManage: boolean }) {
  async function toggleDisabled(id: string, disabled: boolean) {
    await setPortalUserDisabled(id, clientId, disabled);
  }
  async function remove(id: string) {
    if (!confirm("Remove this contact's portal access? They won't be able to sign in again.")) return;
    await deletePortalUser(id, clientId);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Portal logins
        </CardTitle>
        {canManage && users.length > 0 ? <CreateDialog clientId={clientId} /> : null}
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No portal contacts yet"
            description="Create a login so this client can see their results, campaigns and reports, and message the team."
            action={canManage ? <CreateDialog clientId={clientId} /> : undefined}
          />
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {u.name}
                    {u.disabledAt ? <Badge variant="secondary">Disabled</Badge> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.email} &middot; {u.lastLoginAt ? `last in ${format(new Date(u.lastLoginAt), "d MMM yyyy")}` : "never signed in"}
                  </p>
                </div>
                {canManage ? (
                  <div className="flex items-center gap-1">
                    <ResetPasswordDialog clientId={clientId} portalUserId={u.id} />
                    <Button variant="ghost" size="sm" onClick={() => toggleDisabled(u.id, !u.disabledAt)}>
                      {u.disabledAt ? "Enable" : "Disable"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => remove(u.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
