"use client";

import { useActionState, useState, useTransition } from "react";
import { format } from "date-fns";
import { Package, Plus, Trash2, Check, ChevronDown, ImagePlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { GBP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABEL,
  PRODUCT_CATEGORY_FIELDS,
  MAX_PRODUCT_VARIANTS,
  type ProductCategory,
} from "@/lib/product-categories";
import { addClientProduct, setClientProductStatus, deleteClientProduct } from "@/server/actions/client-portal";

type Photo = { fileId?: string; url: string; fileName?: string };
type Variant = { id: string; label: string; price: number | null; quantity: number | null; sku: string | null };
export type ProductRow = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number | null;
  quantity: number | null;
  description: string | null;
  attributes: Record<string, string>;
  photos: Photo[];
  status: "PENDING" | "LISTED" | "DECLINED";
  addedByPortal: boolean;
  createdAt: string;
  variants: Variant[];
};

type VariantDraft = { label: string; price: string; quantity: string; sku: string };
const emptyVariantDraft = (): VariantDraft => ({ label: "", price: "", quantity: "", sku: "" });

const STATUSES = ["PENDING", "LISTED", "DECLINED"] as const;
const STATUS_LABEL = { PENDING: "Pending", LISTED: "Listed", DECLINED: "Declined" } as const;
const STATUS_FILL = {
  PENDING: "bg-muted text-muted-foreground",
  LISTED: "bg-success/15 text-success",
  DECLINED: "bg-destructive/15 text-destructive",
} as const;

const initial: { error?: string; ok?: boolean } = {};

function AddDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ProductCategory>("CLOTHING");
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => (await addClientProduct(formData)) ?? {},
    initial,
  );
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) {
      setOpen(false);
      setVariants([]);
    }
  }

  const fields = PRODUCT_CATEGORY_FIELDS[category];
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add product</Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Add a product</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="photos" value="[]" />
          <input type="hidden" name="variants" value={serializedVariants} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cp-name">Name</Label>
              <Input id="cp-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-category">Category</Label>
              <Select name="category" value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
                <SelectTrigger id="cp-category" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{PRODUCT_CATEGORY_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cp-price">Price (£)</Label>
              <Input id="cp-price" name="price" type="number" min="0" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-quantity">Quantity</Label>
              <Input id="cp-quantity" name="quantity" type="number" min="0" step="1" />
            </div>
          </div>
          {fields.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`cp-attr-${f.key}`}>{f.label}</Label>
                  {f.type === "select" ? (
                    <Select name={`attr_${f.key}`}>
                      <SelectTrigger id={`cp-attr-${f.key}`} className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id={`cp-attr-${f.key}`} name={`attr_${f.key}`} placeholder={f.placeholder} />
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variants <span className="text-muted-foreground">(optional)</span></Label>
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
            <Label htmlFor="cp-description">Description</Label>
            <Textarea id="cp-description" name="description" rows={2} />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductRowItem({ clientId, product }: { clientId: string; product: ProductRow }) {
  const [pending, startTransition] = useTransition();
  const attrEntries = Object.entries(product.attributes);

  function setStatus(status: ProductRow["status"]) {
    startTransition(() => {
      setClientProductStatus(product.id, clientId, status);
    });
  }
  function remove() {
    startTransition(() => {
      deleteClientProduct(product.id, clientId);
    });
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{product.name}</p>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">{PRODUCT_CATEGORY_LABEL[product.category]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {product.addedByPortal ? "from client" : "added by team"} &middot; {format(new Date(product.createdAt), "d MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={pending}
              className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-85", STATUS_FILL[product.status])}
            >
              {STATUS_LABEL[product.status]}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                  {STATUS_LABEL[s]}
                  {s === product.status ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={remove} disabled={pending}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {product.price != null || product.quantity != null || attrEntries.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2 text-sm">
          {product.price != null ? <div><span className="text-muted-foreground">Price </span>{GBP.format(product.price)}</div> : null}
          {product.quantity != null ? <div><span className="text-muted-foreground">Qty </span>{product.quantity}</div> : null}
          {attrEntries.map(([key, value]) => (
            <div key={key}><span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()} </span>{value}</div>
          ))}
        </div>
      ) : null}

      {product.description ? <p className="mt-2 text-sm text-muted-foreground">{product.description}</p> : null}

      {product.variants.length > 0 ? (
        <div className="mt-2 space-y-1.5 border-t border-border pt-2">
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
        <div className="mt-2 flex flex-wrap gap-2">
          {product.photos.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground hover:text-primary">
              <ImagePlus className="h-3 w-3" /> {p.fileName ?? `Photo ${i + 1}`}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PortalProductsSection({ clientId, products, canManage }: { clientId: string; products: ProductRow[]; canManage: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4 text-muted-foreground" />
          Products to list
        </CardTitle>
        {canManage && products.length > 0 ? <AddDialog clientId={clientId} /> : null}
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" description="Products the client sends to be listed — or add one yourself — show up here." action={canManage ? <AddDialog clientId={clientId} /> : undefined} />
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <ProductRowItem key={p.id} clientId={clientId} product={p} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
