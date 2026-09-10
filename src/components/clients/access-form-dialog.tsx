"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addClientAccess, updateClientAccess } from "@/server/actions/access";

type AccessDefaults = {
  id: string;
  label: string;
  username: string | null;
  url: string | null;
  notes: string | null;
};

const initialState: { error?: string; ok?: boolean } = {};

export function AccessFormDialog({ clientId, access }: { clientId: string; access?: AccessDefaults }) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(access);

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      return isEdit ? await updateClientAccess(access!.id, formData) : await addClientAccess(formData);
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
      {isEdit ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add access
        </Button>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit access" : "Add account access"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {!isEdit ? <input type="hidden" name="clientId" value={clientId} /> : null}
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              name="label"
              placeholder="e.g. eBay seller account"
              defaultValue={access?.label}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username / email</Label>
              <Input id="username" name="username" defaultValue={access?.username ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">{isEdit ? "New password" : "Password"}</Label>
              <Input
                id="secret"
                name="secret"
                type="password"
                autoComplete="off"
                placeholder={isEdit ? "Leave blank to keep current" : ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Login URL</Label>
            <Input id="url" name="url" type="url" placeholder="https://…" defaultValue={access?.url ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={access?.notes ?? ""}
              placeholder="e.g. 2FA goes to the client's phone — call before logging in"
            />
          </div>

          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add access"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
