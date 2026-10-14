"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { addClientReport, deleteClientReport } from "@/server/actions/client-portal";

export type ReportRow = { id: string; title: string; period: string | null; url: string; summary: string | null; createdAt: string };

const initial: { error?: string; ok?: boolean } = {};

function AddDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await addClientReport(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add report</Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Link a report</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="space-y-2">
            <Label htmlFor="rp-title">Title</Label>
            <Input id="rp-title" name="title" placeholder="September performance report" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rp-period">Period</Label>
              <Input id="rp-period" name="period" placeholder="September 2026" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-url">Link</Label>
              <Input id="rp-url" name="url" placeholder="https://" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rp-summary">Summary</Label>
            <Textarea id="rp-summary" name="summary" rows={2} />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PortalReportsSection({ clientId, reports, canManage }: { clientId: string; reports: ReportRow[]; canManage: boolean }) {
  async function remove(id: string) {
    await deleteClientReport(id, clientId);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Reports shown to the client
        </CardTitle>
        {canManage && reports.length > 0 ? <AddDialog clientId={clientId} /> : null}
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports linked" description="Link your scorecards and monthly reports here." action={canManage ? <AddDialog clientId={clientId} /> : undefined} />
        ) : (
          <ul className="divide-y divide-border">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary">
                  <span className="truncate">{r.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{r.period ? `${r.period} · ` : ""}{format(new Date(r.createdAt), "d MMM yyyy")}</span>
                  {canManage ? (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => remove(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
