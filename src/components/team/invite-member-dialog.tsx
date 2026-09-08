"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUser } from "@/server/actions/team";

const initialState: { error?: string; ok?: boolean } = {};

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      return await inviteUser(formData);
    },
    initialState,
  );

  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" /> Invite team member
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue="MEMBER">
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Team member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <p className="text-xs text-muted-foreground">
            They&apos;ll sign in with a one-time email link. They can add a password later from Settings.
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Inviting…" : "Send invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
