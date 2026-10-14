"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BASE_PATH } from "@/lib/base-path";
import { MAX_UPLOAD_LABEL } from "@/lib/uploads";

export type UploadedFile = { id: string; fileName: string; size: number; contentType: string; url: string };

/**
 * A file-picker button that uploads immediately on selection (via POST /api/files/upload)
 * and hands the caller the resulting file once it's stored — the caller decides what to
 * do with it (fill a URL field, attach it to a form, etc.), this component only uploads.
 */
export function FileUploadField({
  clientId,
  onUploaded,
  accept,
  label = "Upload a file",
}: {
  // Only required for team uploads — the server authorizes against canAccessClient().
  // Portal uploads always use the signed-in portal user's own clientId server-side, so
  // this is ignored there and can be omitted.
  clientId?: string;
  onUploaded: (file: UploadedFile) => void;
  accept?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setPending(true);
    try {
      const body = new FormData();
      body.set("file", file);
      if (clientId) body.set("clientId", clientId);
      const res = await fetch(`${BASE_PATH}/api/files/upload`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed");
        return;
      }
      toast.success("Uploaded");
      onUploaded(data as UploadedFile);
    } catch {
      toast.error("Upload failed — check your connection and try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" disabled={pending} />
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {pending ? "Uploading…" : label}
      </Button>
      <p className="mt-1 text-[11px] text-muted-foreground">Images, PDFs and office files, up to {MAX_UPLOAD_LABEL}.</p>
    </div>
  );
}
