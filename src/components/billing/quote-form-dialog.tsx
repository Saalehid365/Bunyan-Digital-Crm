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
import { LineItemsEditor } from "@/components/billing/line-items-editor";
import { createQuote } from "@/server/actions/quotes";

type ClientServiceOption = { id: string; name: string };
type ClientOption = { id: string; name: string };

const initialState: { error?: string; id?: string } = {};

export function QuoteFormDialog({
  open,
  onOpenChange,
  clientId,
  clients,
  clientServicesByClient,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fixed client — hides the client picker. Omit (with `clients`) to let the user choose. */
  clientId?: string;
  clients?: ClientOption[];
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
      return await createQuote(formData);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New quote</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {clientId ? (
            <input type="hidden" name="clientId" value={clientId} />
          ) : (
            <input type="hidden" name="clientId" value={selectedClientId} />
          )}

          {!clientId && clients ? (
            <div className="space-y-2">
              <Label htmlFor="quoteClientPicker">Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="quoteClientPicker" className="w-full">
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
            <Label htmlFor="quoteTitle">Title</Label>
            <Input id="quoteTitle" name="title" placeholder='e.g. "eBay setup & Q4 management"' required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quoteIssueDate">Issue date</Label>
              <Input id="quoteIssueDate" name="issueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteExpiryDate">Expires</Label>
              <Input id="quoteExpiryDate" name="expiryDate" type="date" />
            </div>
          </div>

          <LineItemsEditor clientServices={clientServices} />

          <div className="space-y-2">
            <Label htmlFor="quoteNotes">Notes</Label>
            <Textarea id="quoteNotes" name="notes" rows={2} />
          </div>

          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !selectedClientId}>
              {pending ? "Creating…" : "Create quote"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
