"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Palette, Image as ImageIcon, KeyRound, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploadField, type UploadedFile } from "@/components/upload/file-upload-field";
import { savePortalBrandPage, deletePortalAsset } from "@/server/actions/portal-actions";

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

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await savePortalBrandPage(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) toast.success("Sent to the team");
  }

  const [uploadedLogo, setUploadedLogo] = useState<UploadedFile | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  async function removeAsset(id: string) {
    const result = await deletePortalAsset(id);
    if (result?.error) toast.error(result.error);
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Everything on this page — colours, logo, an extra file, an access login —
          submits together with the one button at the end, not a save per section. */}
      <input type="hidden" name="logoFileId" value={uploadedLogo?.id ?? ""} />
      <input type="hidden" name="logoUrl" value={uploadedLogo?.url ?? logo?.url ?? ""} />
      <input type="hidden" name="fileFileId" value={uploadedFile?.id ?? ""} />
      {uploadedFile ? <input type="hidden" name="fileUrl" value={uploadedFile.url} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Brand kit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Add another file <span className="font-normal text-muted-foreground">(optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fileLabel">Label</Label>
              <Input id="fileLabel" name="fileLabel" placeholder="Product photos — autumn range" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fileKind">Type</Label>
              <Select name="fileKind" defaultValue="BRAND_FILE">
                <SelectTrigger id="fileKind" className="w-full"><SelectValue /></SelectTrigger>
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
            <Label htmlFor="fileUrlInput">{uploadedFile ? "Uploaded file" : "Link"}</Label>
            {uploadedFile ? (
              <p className="rounded-md border border-white/10 bg-background/40 px-2.5 py-1.5 text-sm text-foreground">{uploadedFile.fileName}</p>
            ) : (
              <Input id="fileUrlInput" name="fileUrl" placeholder="https://drive.google.com/…" />
            )}
            <div className="flex items-center gap-2">
              <FileUploadField label={uploadedFile ? "Replace file" : "Or upload a file"} onUploaded={(f) => setUploadedFile(f)} />
              {uploadedFile ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>Use a link instead</Button>
              ) : null}
            </div>
          </div>

          {otherAssets.length > 0 ? (
            <ul className="divide-y divide-white/10 border-t border-white/10 pt-1">
              {otherAssets.map((a) => (
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
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => removeAsset(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Share an account login <span className="font-normal text-muted-foreground">(optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="accessLabel">What is it</Label>
              <Input id="accessLabel" name="accessLabel" placeholder="Shopify admin" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessUsername">Username / email</Label>
              <Input id="accessUsername" name="accessUsername" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="accessSecret">Password</Label>
              <Input id="accessSecret" name="accessSecret" type="password" autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessUrl">Link (optional)</Label>
              <Input id="accessUrl" name="accessUrl" placeholder="https://" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accessNotes">Notes</Label>
            <Textarea id="accessNotes" name="accessNotes" rows={2} placeholder="Anything the team should know" />
          </div>
          <p className="text-xs text-muted-foreground">Stored encrypted — only the Bunyan Digital team can see it.</p>

          {accessEntries.length > 0 ? (
            <ul className="divide-y divide-white/10 border-t border-white/10 pt-1">
              {accessEntries.map((a) => (
                <li key={a.id} className="py-2.5">
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.username ? `${a.username} · ` : ""}shared {format(new Date(a.createdAt), "d MMM yyyy")}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Save & send to the team"}
      </Button>
    </form>
  );
}
