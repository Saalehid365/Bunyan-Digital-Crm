"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { CLIENT_STATUS_LABEL } from "@/lib/constants";
import { createClient, updateClient } from "@/server/actions/clients";
import type { ClientStatus } from "@prisma/client";

type ClientDefaults = {
  id?: string;
  name?: string;
  companyName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status?: ClientStatus;
  notes?: string | null;
};

const initialState: { error?: string; id?: string; ok?: boolean } = {};

export function ClientForm({
  client,
  onSaved,
}: {
  client?: ClientDefaults;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(client?.id);

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = isEdit
        ? await updateClient(client!.id!, formData)
        : await createClient(formData);
      return result;
    },
    initialState,
  );

  useEffect(() => {
    if (state.ok || state.id) {
      onSaved?.();
      if (state.id) router.push(`/clients/${state.id}`);
      else router.refresh();
    }
  }, [state, onSaved, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Client name</Label>
          <Input id="name" name="name" defaultValue={client?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company</Label>
          <Input id="companyName" name="companyName" defaultValue={client?.companyName ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact name</Label>
          <Input id="contactName" name="contactName" defaultValue={client?.contactName ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={client?.status ?? "LEAD"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CLIENT_STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={client?.contactEmail ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" name="contactPhone" defaultValue={client?.contactPhone ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={client?.notes ?? ""} />
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create client"}
        </Button>
      </div>
    </form>
  );
}
