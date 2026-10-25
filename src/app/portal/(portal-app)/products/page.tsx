import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { toAttributesRecord, toPhotosArray } from "@/lib/products";
import { PortalProducts } from "@/components/portal/portal-products";

export default async function PortalProductsPage() {
  const portalUser = await requirePortalUser();

  const products = await prisma.clientProduct.findMany({
    where: { clientId: portalUser.clientId },
    orderBy: { createdAt: "desc" },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send us products you&apos;d like listed — we&apos;ll take it from here.
        </p>
      </div>
      <PortalProducts
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price ? Number(p.price) : null,
          quantity: p.quantity,
          description: p.description,
          attributes: toAttributesRecord(p.attributes),
          photos: toPhotosArray(p.photos),
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          variants: p.variants.map((v) => ({
            id: v.id,
            label: v.label,
            price: v.price ? Number(v.price) : null,
            quantity: v.quantity,
            sku: v.sku,
          })),
        }))}
      />
    </div>
  );
}
