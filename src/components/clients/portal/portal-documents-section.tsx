"use client";

import { useActionState, useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Trash2, FileSignature, ExternalLink, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { FileUploadField, type UploadedFile } from "@/components/upload/file-upload-field";
import { addClientDocument, setClientDocumentStatus, deleteClientDocument } from "@/server/actions/client-portal";

export type DocumentRow = {
  id: string;
  title: string;
  kind: "AGREEMENT" | "QUESTIONNAIRE" | "FORM" | "OTHER";
  url: string;
  notes: string | null;
  status: "PENDING" | "COMPLETED";
  dueDate: string | null;
  completedAt: string | null;
};

const KIND_LABEL: Record<DocumentRow["kind"], string> = {
  AGREEMENT: "Agreement",
  QUESTIONNAIRE: "Questionnaire",
  FORM: "Form",
  OTHER: "Document",
};

const initial: { error?: string; ok?: boolean } = {};

function AddDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await addClientDocument(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) {
      setOpen(false);
      setUploaded(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Send document</Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Send a document</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="fileId" value={uploaded?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="d-title">Title</Label>
            <Input id="d-title" name="title" placeholder="Service agreement" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="d-kind">Type</Label>
              <Select name="kind" defaultValue="AGREEMENT">
                <SelectTrigger id="d-kind" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABEL) as DocumentRow["kind"][]).map((k) => (
                    <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-due">Due date</Label>
              <Input id="d-due" name="dueDate" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-url">{uploaded ? "Uploaded file" : "Link"}</Label>
            {uploaded ? (
              <p className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-sm text-foreground">{uploaded.fileName}</p>
            ) : (
              <Input id="d-url" name="url" placeholder="https://docs.google.com/forms/…" required />
            )}
            <div className="flex items-center gap-2">
              <FileUploadField
                clientId={clientId}
                label={uploaded ? "Replace file" : "Or upload a file"}
                onUploaded={(f) => setUploaded(f)}
              />
              {uploaded ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setUploaded(null)}>Use a link instead</Button>
              ) : null}
            </div>
          </div>
          {uploaded ? <input type="hidden" name="url" value={uploaded.url} /> : null}
          <div className="space-y-2">
            <Label htmlFor="d-notes">Notes for the client</Label>
            <Textarea id="d-notes" name="notes" rows={2} placeholder="What this is and why we need it" />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Sending…" : "Send"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PortalDocumentsSection({ clientId, documents, canManage }: { clientId: string; documents: DocumentRow[]; canManage: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle(id: string, status: DocumentRow["status"]) {
    startTransition(() => {
      setClientDocumentStatus(id, clientId, status === "PENDING" ? "COMPLETED" : "PENDING");
    });
  }
  function remove(id: string) {
    startTransition(() => {
      deleteClientDocument(id, clientId);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileSignature className="h-4 w-4 text-muted-foreground" />
          Documents for the client to action
        </CardTitle>
        {canManage && documents.length > 0 ? <AddDialog clientId={clientId} /> : null}
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="No documents sent"
            description="Send an agreement to sign, a Google Form questionnaire, or any other document the client needs to action."
            action={canManage ? <AddDialog clientId={clientId} /> : undefined}
          />
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary">
                      {d.title}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">{KIND_LABEL[d.kind]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.status === "COMPLETED" && d.completedAt
                      ? `Completed ${format(new Date(d.completedAt), "d MMM yyyy")}`
                      : d.dueDate
                        ? `Due ${format(new Date(d.dueDate), "d MMM yyyy")}`
                        : "No deadline"}
                  </p>
                </div>
                {canManage ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant={d.status === "COMPLETED" ? "secondary" : "outline"}
                      size="sm"
                      disabled={pending}
                      onClick={() => toggle(d.id, d.status)}
                    >
                      {d.status === "COMPLETED" ? <><Check className="h-3.5 w-3.5" /> Done</> : "Mark done"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => remove(d.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Badge className={d.status === "COMPLETED" ? "border-0 bg-success/15 text-success" : "border-0 bg-muted text-muted-foreground"}>
                    {d.status === "COMPLETED" ? "Done" : "Pending"}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
