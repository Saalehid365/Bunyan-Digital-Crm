import { notFound } from "next/navigation";
import { requireUser, getClientForUser, hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { toColorsArray } from "@/lib/brand-colors";
import { toAttributesRecord, toPhotosArray } from "@/lib/products";
import { ClientPortalManagement } from "@/components/clients/portal/client-portal-management";

export default async function ClientPortalPage({ params }: { params: Promise<{ clientId: string }> }) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();
  const canManageClients = await hasPermission(user, "MANAGE_CLIENTS");

  const [portalUsers, results, campaigns, reports, documents, products, assets, brandKit, messages] = await Promise.all([
    prisma.clientPortalUser.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } }),
    prisma.clientResult.findMany({ where: { clientId }, orderBy: [{ period: "desc" }, { position: "asc" }] }),
    prisma.clientCampaign.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } }),
    prisma.clientReport.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } }),
    prisma.clientDocument.findMany({ where: { clientId }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    prisma.clientProduct.findMany({
      where: { clientId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { variants: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.clientAsset.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } }),
    prisma.clientBrandKit.findUnique({ where: { clientId } }),
    prisma.clientMessage.findMany({
      where: { clientId },
      orderBy: { createdAt: "asc" },
      include: { senderUser: { select: { name: true } }, senderPortalUser: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <ClientPortalManagement
        clientId={clientId}
        canManageClients={canManageClients}
        portalUsers={portalUsers.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          disabledAt: p.disabledAt?.toISOString() ?? null,
          lastLoginAt: p.lastLoginAt?.toISOString() ?? null,
        }))}
        results={results.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        campaigns={campaigns.map((c) => ({
          ...c,
          startDate: c.startDate?.toISOString() ?? null,
          endDate: c.endDate?.toISOString() ?? null,
          spend: c.spend ? Number(c.spend) : null,
          revenue: c.revenue ? Number(c.revenue) : null,
          roas: c.roas ? Number(c.roas) : null,
        }))}
        reports={reports.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        documents={documents.map((d) => ({
          ...d,
          dueDate: d.dueDate?.toISOString() ?? null,
          completedAt: d.completedAt?.toISOString() ?? null,
        }))}
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
          addedByPortal: p.addedByPortal,
          createdAt: p.createdAt.toISOString(),
          variants: p.variants.map((v) => ({
            id: v.id,
            label: v.label,
            price: v.price ? Number(v.price) : null,
            quantity: v.quantity,
            sku: v.sku,
          })),
        }))}
        assets={assets.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        brandKit={brandKit ? { colors: toColorsArray(brandKit.colors), notes: brandKit.notes } : null}
        messages={messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderKind: m.senderKind,
          senderName: m.senderKind === "TEAM" ? (m.senderUser?.name ?? "Team") : (m.senderPortalUser?.name ?? "Client"),
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
