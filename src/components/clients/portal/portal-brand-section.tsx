"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Palette, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { FileUploadField, type UploadedFile } from "@/components/upload/file-upload-field";
import { saveBrandKit, addClientAsset, deleteClientAsset } from "@/server/actions/client-portal";

export type BrandKit = { colors: string[]; notes: string | null };
export type AssetRow = { id: string; kind: "LOGO" | "BRAND_FILE" | "PRODUCT_PHOTO" | "OTHER"; label: string; url: string; createdAt: string; addedByPortal: boolean };

const KIND_LABEL: Record<AssetRow["kind"], string> = { LOGO: "Logo", BRAND_FILE: "Brand file", PRODUCT_PHOTO: "Product photo", OTHER: "Other" };
const initial: { error?: string; ok?: boolean } = {};

function BrandKitForm({ clientId, brandKit }: { clientId: string; brandKit: BrandKit | null }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await saveBrandKit(formData)) ?? {},
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="space-y-2">
        <Label>Colours (up to 5)</Label>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Input key={i} name="colors" placeholder={`#______`} defaultValue={brandKit?.colors[i] ?? ""} aria-label={`Colour ${i + 1}`} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-notes">Other brand information</Label>
        <Textarea id="b-notes" name="notes" rows={3} defaultValue={brandKit?.notes ?? ""} />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

function AddAssetDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await addClientAsset(formData)) ?? {},
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
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add</Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add a logo or file</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="fileId" value={uploaded?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="a-label">Label</Label>
            <Input id="a-label" name="label" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-kind">Type</Label>
            <Select name="kind" defaultValue="LOGO">
              <SelectTrigger id="a-kind" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABEL) as AssetRow["kind"][]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-url">{uploaded ? "Uploaded file" : "Link"}</Label>
            {uploaded ? (
              <p className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-sm text-foreground">{uploaded.fileName}</p>
            ) : (
              <Input id="a-url" name="url" placeholder="https://" required />
            )}
            <div className="flex items-center gap-2">
              <FileUploadField
                clientId={clientId}
                label={uploaded ? "Replace file" : "Upload a file instead"}
                onUploaded={(f) => setUploaded(f)}
              />
              {uploaded ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setUploaded(null)}>Use a link instead</Button>
              ) : null}
            </div>
          </div>
          {uploaded ? <input type="hidden" name="url" value={uploaded.url} /> : null}
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PortalBrandSection({
  clientId,
  brandKit,
  assets,
  canManage,
}: {
  clientId: string;
  brandKit: BrandKit | null;
  assets: AssetRow[];
  canManage: boolean;
}) {
  async function remove(id: string) {
    await deleteClientAsset(id, clientId);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Brand kit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BrandKitForm clientId={clientId} brandKit={brandKit} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Logos &amp; files
          </CardTitle>
          {canManage ? <AddAssetDialog clientId={clientId} /> : null}
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No assets yet" description="Assets the client adds, or add one yourself, show up here." />
          ) : (
            <ul className="divide-y divide-border">
              {assets.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary">
                    <span className="truncate">{a.label}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <span>{KIND_LABEL[a.kind]} &middot; {a.addedByPortal ? "from client" : "by team"} &middot; {format(new Date(a.createdAt), "d MMM yyyy")}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => remove(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
