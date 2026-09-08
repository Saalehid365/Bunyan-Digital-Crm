"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITY_LABEL, RECURRENCE_LABEL, JOB_STAGE_LABEL } from "@/lib/constants";
import { createJob } from "@/server/actions/jobs";
import type { JobStage } from "@prisma/client";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };
type ClientOption = { id: string; name: string };

const initialState: { error?: string; id?: string } = {};

export function JobFormDialog({
  open,
  onOpenChange,
  clientId,
  clients,
  defaultStage,
  assignableUsers,
  clientServicesByClient,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fixed client — hides the client picker. Omit (with `clients`) to let the user choose. */
  clientId?: string;
  /** Clients the user can create a job for, used only when `clientId` isn't fixed. */
  clients?: ClientOption[];
  defaultStage: JobStage;
  assignableUsers: AssignableUser[];
  clientServicesByClient: Record<string, ClientServiceOption[]>;
  onDone: () => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState(clientId ?? clients?.[0]?.id ?? "");
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) setSelectedClientId(clientId ?? clients?.[0]?.id ?? "");
  }

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      return await createJob(formData);
    },
    initialState,
  );

  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.id) onDone();
  }

  const clientServices = clientServicesByClient[selectedClientId] ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New job</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {clientId ? (
            <input type="hidden" name="clientId" value={clientId} />
          ) : (
            <input type="hidden" name="clientId" value={selectedClientId} />
          )}
          <input type="hidden" name="stage" value={defaultStage} />

          {!clientId && clients ? (
            <div className="space-y-2">
              <Label htmlFor="clientPicker">Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="clientPicker" className="w-full">
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder='e.g. "eBay Management – September"' required autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="MEDIUM">
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence">Repeats</Label>
              <Select name="recurrence" defaultValue="NONE">
                <SelectTrigger id="recurrence" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assignee</Label>
              <Select name="assignedToId" defaultValue="unassigned">
                <SelectTrigger id="assignedToId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {clientServices.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="clientServiceId">Service</Label>
                <Select key={selectedClientId} name="clientServiceId" defaultValue="none">
                  <SelectTrigger id="clientServiceId" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clientServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !selectedClientId}>
              {pending ? "Creating…" : `Add to ${JOB_STAGE_LABEL[defaultStage]}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
