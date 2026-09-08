"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { addClientService } from "@/server/actions/services";
import { SERVICE_STATUS_LABEL } from "@/lib/constants";
import type { BillingType } from "@prisma/client";

type ServiceType = { id: string; name: string; colorHex: string };

const initialState: { error?: string; ok?: boolean } = {};

const BILLING_TABS: { value: BillingType; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONE_OFF", label: "One-off" },
];

export function ClientServiceFormDialog({
  clientId,
  serviceTypes,
}: {
  clientId: string;
  serviceTypes: ServiceType[];
}) {
  const [open, setOpen] = useState(false);
  const [billingType, setBillingType] = useState<BillingType>("MONTHLY");
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      return await addClientService(formData);
    },
    initialState,
  );

  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok) setOpen(false);
  }

  if (serviceTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No services in your catalog yet — add one in Settings first.
      </p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add service
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a service</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="space-y-2">
            <Label htmlFor="serviceTypeId">Service</Label>
            <Select name="serviceTypeId" required>
              <SelectTrigger id="serviceTypeId" className="w-full">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input id="label" name="label" placeholder="e.g. UK store" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="ACTIVE">
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_STATUS_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Billing</Label>
            <input type="hidden" name="billingType" value={billingType} />
            <div className="inline-flex rounded-[var(--radius-sm)] border border-border p-0.5">
              {BILLING_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setBillingType(tab.value)}
                  className={cn(
                    "rounded-[calc(var(--radius-sm)-2px)] px-3 py-1 text-xs font-medium transition-colors",
                    billingType === tab.value
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceValue">
                {billingType === "MONTHLY" ? "Monthly value (£)" : "One-off cost (£)"}
              </Label>
              <Input id="priceValue" name="priceValue" type="number" min="0" step="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">{billingType === "MONTHLY" ? "Start date" : "Date"}</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>

          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
