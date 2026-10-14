"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Palette, Image as ImageIcon, KeyRound, ExternalLink, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { FileUploadField, type UploadedFile } from "@/components/upload/file-upload-field";
import { savePortalBrandKit, addPortalAsset, deletePortalAsset, submitPortalAccess } from "@/server/actions/portal-actions";

type BrandKit = { primaryColor: string | null; secondaryColor: string | null; accentColor: string | null; notes: string | null };
type Asset = { id: string; kind: "LOGO" | "BRAND_FILE" | "PRODUCT_PHOTO" | "OTHER"; label: string; url: string; createdAt: string; addedByPortal: boolean };
type AccessEntry = { id: string; label: string; username: string | null; url: string | null; createdAt: string };

const KIND_LABEL: Record<Asset["kind"], string> = {
  LOGO: "Logo",
  BRAND_FILE: "Brand file",
  PRODUCT_PHOTO: "Product photo",
  OTHER: "Other",
};

const initial: { error?: string; ok?: boolean } = {};

function ColorSwatch({ hex }: { hex: string | null }) {
  if (!hex) return null;
  const isHex = /^#[0-9a-f]{3,8}$/i.test(hex.trim());
  return <span className="h-4 w-4 shrink-0 rounded-full border border-white/20" style={isHex ? { background: hex } : undefined} />;
}

function BrandKitForm({ brandKit, logo }: { brandKit: BrandKit | null; logo: Asset | undefined }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await savePortalBrandKit(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  const [uploadedLogo, setUploadedLogo] = useState<UploadedFile | null>(null);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) toast.success("Brand kit saved");
  }

  const logoUrlValue = uploadedLogo?.url;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Palette className="h-4 w-4 text-muted-foreground" />
          Brand kit
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Colours, logo and notes all submit together — one Save for the whole brand kit,
            not a separate step per field. */}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="logoFileId" value={uploadedLogo?.id ?? ""} />
          {!uploadedLogo ? <input type="hidden" name="logoUrl" value={logo?.url ?? ""} /> : null}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary</Label>
              <div className="flex items-center gap-2">
                <ColorSwatch hex={brandKit?.primaryColor ?? null} />
                <Input id="primaryColor" name="primaryColor" placeholder="#3347FF" defaultValue={brandKit?.primaryColor ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary</Label>
              <Input id="secondaryColor" name="secondaryColor" placeholder="#0A0E17" defaultValue={brandKit?.secondaryColor ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent</Label>
              <Input id="accentColor" name="accentColor" placeholder="#6E7DFF" defaultValue={brandKit?.accentColor ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            {uploadedLogo ? (
              <p className="rounded-md border border-white/10 bg-background/40 px-2.5 py-1.5 text-sm text-foreground">{uploadedLogo.fileName}</p>
            ) : logo ? (
              <a href={logo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 truncate text-sm text-foreground hover:text-primary">
                Current logo <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No logo uploaded yet.</p>
            )}
            <FileUploadField
              label={logo || uploadedLogo ? "Replace logo" : "Upload a logo"}
              accept="image/*"
              onUploaded={(f) => setUploadedLogo(f)}
            />
          </div>
          {logoUrlValue ? <input type="hidden" name="logoUrl" value={logoUrlValue} /> : null}
          <div className="space-y-2">
            <Label htmlFor="notes">Other brand information</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="Fonts, tone of voice, anything else we should know about your brand…"
              defaultValue={brandKit?.notes ?? ""}
            />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AssetForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await addPortalAsset(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  const [open, setOpen] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) {
      setOpen(false);
      setUploaded(null);
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3 rounded-lg border border-white/10 bg-card/40 p-3">
      <input type="hidden" name="fileId" value={uploaded?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="asset-label">Label</Label>
          <Input id="asset-label" name="label" placeholder="Primary logo" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="asset-kind">Type</Label>
          {/* Logo has its own field in the brand kit above — not offered here, so there's
              only ever one place to send it. */}
          <Select name="kind" defaultValue="BRAND_FILE">
            <SelectTrigger id="asset-kind" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(KIND_LABEL) as Asset["kind"][])
                .filter((k) => k !== "LOGO")
                .map((k) => (
                  <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="asset-url">{uploaded ? "Uploaded file" : "Link"}</Label>
        {uploaded ? (
          <p className="rounded-md border border-white/10 bg-background/40 px-2.5 py-1.5 text-sm text-foreground">{uploaded.fileName}</p>
        ) : (
          <Input id="asset-url" name="url" placeholder="https://drive.google.com/…" required />
        )}
        <div className="flex items-center gap-2">
          <FileUploadField label={uploaded ? "Replace file" : "Or upload a file"} onUploaded={(f) => setUploaded(f)} />
          {uploaded ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setUploaded(null)}>Use a link instead</Button>
          ) : null}
        </div>
      </div>
      {uploaded ? <input type="hidden" name="url" value={uploaded.url} /> : null}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

function AssetsSection({ assets }: { assets: Asset[] }) {
  async function remove(id: string) {
    const result = await deletePortalAsset(id);
    if (result?.error) toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          Additional files
        </CardTitle>
        <AssetForm />
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No additional files yet"
            description="Add a link to any other brand files or product photos — Google Drive, Dropbox, Canva, anywhere we can open it."
          />
        ) : (
          <ul className="divide-y divide-white/10">
            {assets.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground hover:text-primary">
                    <span className="truncate">{a.label}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {KIND_LABEL[a.kind]} &middot; added {a.addedByPortal ? "by you" : "by the team"} &middot; {format(new Date(a.createdAt), "d MMM yyyy")}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => remove(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AccessForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await submitPortalAccess(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  const [open, setOpen] = useState(false);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) {
      setOpen(false);
      toast.success("Sent to the team");
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Share a login
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3 rounded-lg border border-white/10 bg-card/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="access-label">What is it</Label>
          <Input id="access-label" name="label" placeholder="Shopify admin" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="access-username">Username / email</Label>
          <Input id="access-username" name="username" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="access-secret">Password</Label>
          <Input id="access-secret" name="secret" type="password" autoComplete="new-password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="access-url">Link (optional)</Label>
          <Input id="access-url" name="url" placeholder="https://" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="access-notes">Notes</Label>
        <Textarea id="access-notes" name="notes" rows={2} placeholder="Anything the team should know" />
      </div>
      <p className="text-xs text-muted-foreground">Stored encrypted — only the Bunyan Digital team can see it.</p>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Sending…" : "Send to the team"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

function AccessSection({ entries }: { entries: AccessEntry[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Account access
        </CardTitle>
        <AccessForm />
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState icon={KeyRound} title="No logins shared yet" description="Share a store or platform login the team needs — passwords are encrypted and never shown back here." />
        ) : (
          <ul className="divide-y divide-white/10">
            {entries.map((a) => (
              <li key={a.id} className="py-2.5">
                <p className="text-sm font-medium text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">
                  {a.username ? `${a.username} · ` : ""}shared {format(new Date(a.createdAt), "d MMM yyyy")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PortalBrandView({
  brandKit,
  assets,
  accessEntries,
}: {
  brandKit: BrandKit | null;
  assets: Asset[];
  accessEntries: AccessEntry[];
}) {
  const logo = assets.find((a) => a.kind === "LOGO");
  const otherAssets = assets.filter((a) => a.kind !== "LOGO");

  return (
    <div className="space-y-5">
      <BrandKitForm brandKit={brandKit} logo={logo} />
      <AssetsSection assets={otherAssets} />
      <AccessSection entries={accessEntries} />
    </div>
  );
}
