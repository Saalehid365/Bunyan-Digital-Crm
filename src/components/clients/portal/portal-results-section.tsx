"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { addClientResult, deleteClientResult } from "@/server/actions/client-portal";

export type ResultRow = { id: string; period: string; label: string; value: string; change: string | null };

const initial: { error?: string; ok?: boolean } = {};

function AddDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await addClientResult(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add result</Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add a result</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="space-y-2">
            <Label htmlFor="r-period">Period</Label>
            <Input id="r-period" name="period" placeholder="September 2026" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-label">Metric</Label>
              <Input id="r-label" name="label" placeholder="Revenue" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-value">Value</Label>
              <Input id="r-value" name="value" placeholder="£18,400" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-change">Change (optional)</Label>
            <Input id="r-change" name="change" placeholder="+12%" />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PortalResultsSection({ clientId, results, canManage }: { clientId: string; results: ResultRow[]; canManage: boolean }) {
  async function remove(id: string) {
    await deleteClientResult(id, clientId);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Results shown to the client
        </CardTitle>
        {canManage && results.length > 0 ? <AddDialog clientId={clientId} /> : null}
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No results published" description="Add the key numbers you want this client to see." action={canManage ? <AddDialog clientId={clientId} /> : undefined} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Change</TableHead>
                {canManage ? <TableHead /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{r.period}</TableCell>
                  <TableCell>{r.label}</TableCell>
                  <TableCell className="font-medium">{r.value}</TableCell>
                  <TableCell className="text-muted-foreground">{r.change ?? "—"}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => remove(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
