"use client";

import { useState, useTransition } from "react";
import { format, isPast } from "date-fns";
import { FileSignature, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { FileUploadField, type UploadedFile } from "@/components/upload/file-upload-field";
import { cn } from "@/lib/utils";
import { markPortalDocumentCompleted } from "@/server/actions/portal-actions";

type Document = {
  id: string;
  title: string;
  kind: "AGREEMENT" | "QUESTIONNAIRE" | "FORM" | "OTHER";
  url: string;
  notes: string | null;
  status: "PENDING" | "COMPLETED";
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
};

const KIND_LABEL: Record<Document["kind"], string> = {
  AGREEMENT: "Agreement",
  QUESTIONNAIRE: "Questionnaire",
  FORM: "Form",
  OTHER: "Document",
};

function DocumentRow({ doc }: { doc: Document }) {
  const [pending, startTransition] = useTransition();
  const overdue = doc.status === "PENDING" && doc.dueDate && isPast(new Date(doc.dueDate));

  function markDone(uploadedFile?: UploadedFile) {
    startTransition(async () => {
      const result = await markPortalDocumentCompleted(doc.id, uploadedFile);
      if (result?.error) toast.error(result.error);
      else toast.success(uploadedFile ? "Uploaded and marked as done — thank you" : "Marked as done — thank you");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{doc.title}</p>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">{KIND_LABEL[doc.kind]}</Badge>
          </div>
          {doc.notes ? <p className="mt-0.5 text-sm text-muted-foreground">{doc.notes}</p> : null}
          <p className={cn("mt-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
            {doc.status === "COMPLETED" && doc.completedAt
              ? `Completed ${format(new Date(doc.completedAt), "d MMM yyyy")}`
              : doc.dueDate
                ? `${overdue ? "Overdue — was due" : "Due"} ${format(new Date(doc.dueDate), "d MMM yyyy")}`
                : "No deadline"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              Open <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          {doc.status === "PENDING" ? (
            <>
              <Button size="sm" onClick={() => markDone()} disabled={pending}>
                <CheckCircle2 className="h-3.5 w-3.5" /> {pending ? "Saving…" : "Mark as done"}
              </Button>
              <FileUploadField label="Or upload your signed copy" onUploaded={(f) => markDone(f)} />
            </>
          ) : (
            <Badge className="border-0 bg-success/15 text-success">Done</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PortalDocuments({ documents }: { documents: Document[] }) {
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const pending = documents.filter((d) => d.status === "PENDING");
  const visible = tab === "pending" ? pending : documents;

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title="No documents yet"
        description="Agreements and questionnaires from the team will appear here for you to review and action."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "pending" ? `To do (${pending.length})` : `All (${documents.length})`}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="All done" description="Nothing outstanding right now." />
      ) : (
        <div className="space-y-3">
          {visible.map((d) => (
            <DocumentRow key={d.id} doc={d} />
          ))}
        </div>
      )}
    </div>
  );
}
