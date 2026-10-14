"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, Megaphone, ChevronDown, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { GBP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { addClientCampaign, updateClientCampaignStatus, deleteClientCampaign } from "@/server/actions/client-portal";

export type CampaignRow = {
  id: string;
  name: string;
  platform: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate: string | null;
  endDate: string | null;
  spend: number | null;
  revenue: number | null;
  roas: number | null;
  notes: string | null;
};

const STATUS_FILL: Record<CampaignRow["status"], string> = {
  ACTIVE: "bg-success/15 text-success",
  PAUSED: "bg-muted text-muted-foreground",
  COMPLETED: "bg-primary/15 text-primary",
};

const initial: { error?: string; ok?: boolean } = {};

function AddDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await addClientCampaign(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add campaign</Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add a campaign</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-platform">Platform</Label>
              <Input id="c-platform" name="platform" placeholder="Meta Ads" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-start">Start date</Label>
              <Input id="c-start" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-status">Status</Label>
              <Select name="status" defaultValue="ACTIVE">
                <SelectTrigger id="c-status" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-spend">Spend (£)</Label>
              <Input id="c-spend" name="spend" type="number" step="0.01" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-revenue">Revenue (£)</Label>
              <Input id="c-revenue" name="revenue" type="number" step="0.01" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-roas">ROAS</Label>
              <Input id="c-roas" name="roas" type="number" step="0.01" min="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-notes">Notes</Label>
            <Textarea id="c-notes" name="notes" rows={2} />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PortalCampaignsSection({ clientId, campaigns, canManage }: { clientId: string; campaigns: CampaignRow[]; canManage: boolean }) {
  async function setStatus(id: string, status: string) {
    await updateClientCampaignStatus(id, clientId, status);
  }
  async function remove(id: string) {
    await deleteClientCampaign(id, clientId);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          Campaigns shown to the client
        </CardTitle>
        {canManage && campaigns.length > 0 ? <AddDialog clientId={clientId} /> : null}
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns yet" description="Add the campaigns you're running for this client." action={canManage ? <AddDialog clientId={clientId} /> : undefined} />
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.platform}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-85",
                            STATUS_FILL[c.status],
                          )}
                        >
                          {c.status}
                          <ChevronDown className="h-3 w-3 opacity-70" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          {(["ACTIVE", "PAUSED", "COMPLETED"] as const).map((s) => (
                            <DropdownMenuItem key={s} onClick={() => setStatus(c.id, s)}>
                              {s}
                              {s === c.status ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge className={cn("border-0", STATUS_FILL[c.status])}>{c.status}</Badge>
                    )}
                    {canManage ? (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => remove(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                {c.spend != null || c.revenue != null || c.roas != null ? (
                  <div className="mt-2 flex flex-wrap gap-4 border-t border-border pt-2 text-sm">
                    {c.spend != null ? <div><span className="text-muted-foreground">Spend </span>{GBP.format(c.spend)}</div> : null}
                    {c.revenue != null ? <div><span className="text-muted-foreground">Revenue </span>{GBP.format(c.revenue)}</div> : null}
                    {c.roas != null ? <div><span className="text-muted-foreground">ROAS </span>{c.roas}x</div> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
