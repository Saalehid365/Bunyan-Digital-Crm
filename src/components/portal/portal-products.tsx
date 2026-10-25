"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Package, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { FileUploadField, type UploadedFile } from "@/components/upload/file-upload-field";
import { GBP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABEL,
  PRODUCT_CATEGORY_FIELDS,
  MAX_PRODUCT_PHOTOS,
  MAX_PRODUCT_VARIANTS,
  type ProductCategory,
} from "@/lib/product-categories";
import { addPortalProduct, deletePortalProduct } from "@/server/actions/portal-actions";

type Photo = { fileId?: string; url: string; fileName?: string };
type Variant = { id: string; label: string; price: number | null; quantity: number | null; sku: string | null };
type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number | null;
  quantity: number | null;
  description: string | null;
  attributes: Record<string, string>;
  photos: Photo[];
  status: "PENDING" | "LISTED" | "DECLINED";
  createdAt: string;
  variants: Variant[];
};

type VariantDraft = { label: string; price: string; quantity: string; sku: string };
const emptyVariantDraft = (): VariantDraft => ({ label: "", price: "", quantity: "", sku: "" });

const STATUS_LABEL = { PENDING: "Pending review", LISTED: "Listed", DECLINED: "Declined" } as const;
const STATUS_FILL = {
  PENDING: "bg-muted text-muted-foreground",
  LISTED: "bg-success/15 text-success",
  DECLINED: "bg-destructive/15 text-destructive",
} as const;

const initial: { error?: string; ok?: boolean } = {};

function AddProductForm() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ProductCategory>("CLOTHING");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await addPortalProduct(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) {
      setOpen(false);
      setPhotos([]);
      setVariants([]);
      setCategory("CLOTHING");
      toast.success("Sent to the team");
    }
  }

  const serializedVariants = JSON.stringify(
    variants
      .filter((v) => v.label.trim())
      .map((v) => ({
        label: v.label.trim(),
        price: v.price.trim() ? Number(v.price) : undefined,
        quantity: v.quantity.trim() ? Number(v.quantity) : undefined,
        sku: v.sku.trim() || undefined,
      })),
  );

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add a product
      </Button>
    );
  }

  const fields = PRODUCT_CATEGORY_FIELDS[category];

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="photos" value={JSON.stringify(photos)} />
          <input type="hidden" name="variants" value={serializedVariants} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Product name</Label>
              <Input id="p-name" name="name" placeholder="e.g. Men's denim jacket" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-category">Category</Label>
              <Select name="category" value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
                <SelectTrigger id="p-category" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{PRODUCT_CATEGORY_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-price">Price you&apos;d like (£)</Label>
              <Input id="p-price" name="price" type="number" min="0" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-quantity">Quantity</Label>
              <Input id="p-quantity" name="quantity" type="number" min="0" step="1" />
            </div>
          </div>

          {fields.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`attr-${f.key}`}>{f.label}</Label>
                  {f.type === "select" ? (
                    <Select name={`attr_${f.key}`}>
                      <SelectTrigger id={`attr-${f.key}`} className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id={`attr-${f.key}`} name={`attr_${f.key}`} placeholder={f.placeholder} />
                  )}
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variants <span className="text-muted-foreground">(sizes, colours, etc — optional)</span></Label>
              {variants.length < MAX_PRODUCT_VARIANTS ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setVariants((vs) => [...vs, emptyVariantDraft()])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add variant
                </Button>
              ) : null}
            </div>
            {variants.length > 0 ? (
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2">
                    <div className="space-y-1">
                      {i === 0 ? <Label className="text-xs text-muted-foreground">Label</Label> : null}
                      <Input
                        value={v.label}
                        placeholder="e.g. Medium / Blue"
                        onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      />
                    </div>
                    <div className="space-y-1">
                      {i === 0 ? <Label className="text-xs text-muted-foreground">Price (£)</Label> : null}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                      />
                    </div>
                    <div className="space-y-1">
                      {i === 0 ? <Label className="text-xs text-muted-foreground">Quantity</Label> : null}
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={v.quantity}
                        onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))}
                      />
                    </div>
                    <div className="space-y-1">
                      {i === 0 ? <Label className="text-xs text-muted-foreground">SKU</Label> : null}
                      <Input
                        value={v.sku}
                        onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground"
                      onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-description">Description</Label>
            <Textarea id="p-description" name="description" rows={3} placeholder="Anything else that would help us list it well" />
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            {photos.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <li key={i} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-background/40 px-2.5 py-1.5 text-sm text-foreground">
                    {p.fileName ?? "Photo"}
                    <button type="button" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {photos.length < MAX_PRODUCT_PHOTOS ? (
              <FileUploadField
                label="Add a photo"
                accept="image/*"
                onUploaded={(f: UploadedFile) => setPhotos((ps) => [...ps, { fileId: f.id, url: f.url, fileName: f.fileName }])}
              />
            ) : (
              <p className="text-xs text-muted-foreground">Up to {MAX_PRODUCT_PHOTOS} photos.</p>
            )}
          </div>

          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send to the team"}</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setPhotos([]);
                setVariants([]);
                setCategory("CLOTHING");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ProductCard({ product }: { product: Product }) {
  async function remove() {
    const result = await deletePortalProduct(product.id);
    if (result?.error) toast.error(result.error);
  }

  const attrEntries = Object.entries(product.attributes);

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{product.name}</p>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">{PRODUCT_CATEGORY_LABEL[product.category]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Sent {format(new Date(product.createdAt), "d MMM yyyy")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border-0", STATUS_FILL[product.status])}>{STATUS_LABEL[product.status]}</Badge>
            {product.status === "PENDING" ? (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={remove}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>

        {product.price != null || product.quantity != null || attrEntries.length > 0 ? (
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 pt-2.5 text-sm">
            {product.price != null ? <div><span className="text-muted-foreground">Price </span>{GBP.format(product.price)}</div> : null}
            {product.quantity != null ? <div><span className="text-muted-foreground">Qty </span>{product.quantity}</div> : null}
            {attrEntries.map(([key, value]) => (
              <div key={key}><span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()} </span>{value}</div>
            ))}
          </div>
        ) : null}

        {product.description ? <p className="text-sm text-muted-foreground">{product.description}</p> : null}

        {product.variants.length > 0 ? (
          <div className="space-y-1.5 border-t border-white/10 pt-2.5">
            <p className="text-xs font-medium text-muted-foreground">Variants</p>
            <ul className="space-y-1">
              {product.variants.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                  <span className="font-medium text-foreground">{v.label}</span>
                  {v.price != null ? <span className="text-muted-foreground">{GBP.format(v.price)}</span> : null}
                  {v.quantity != null ? <span className="text-muted-foreground">Qty {v.quantity}</span> : null}
                  {v.sku ? <span className="text-muted-foreground">SKU {v.sku}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {product.photos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.photos.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md border border-white/10 bg-background/40 px-2.5 py-1.5 text-xs text-foreground hover:text-primary">
                <ImagePlus className="h-3 w-3" /> {p.fileName ?? `Photo ${i + 1}`}
              </a>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PortalProducts({ products }: { products: Product[] }) {
  return (
    <div className="space-y-5">
      <AddProductForm />
      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products sent yet" description="Add a product above — clothes, health products, electronics and more — and we'll take it from there." />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
