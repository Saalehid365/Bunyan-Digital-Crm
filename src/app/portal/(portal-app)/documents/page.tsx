import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { PortalDocuments } from "@/components/portal/portal-documents";

export default async function PortalDocumentsPage() {
  const portalUser = await requirePortalUser();

  const documents = await prisma.clientDocument.findMany({
    where: { clientId: portalUser.clientId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Agreements and forms to review for {portalUser.clientName}.</p>
      </div>
      <PortalDocuments
        documents={documents.map((d) => ({
          ...d,
          dueDate: d.dueDate?.toISOString() ?? null,
          completedAt: d.completedAt?.toISOString() ?? null,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
