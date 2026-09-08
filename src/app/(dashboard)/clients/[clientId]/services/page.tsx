import { notFound } from "next/navigation";
import { Wrench } from "lucide-react";
import { requireUser, getClientForUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientServiceList } from "@/components/services/client-service-list";
import { ClientServiceFormDialog } from "@/components/services/client-service-form-dialog";
import { EmptyState } from "@/components/empty-state";

export default async function ClientServicesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();

  const [services, serviceTypes] = await Promise.all([
    prisma.clientService.findMany({
      where: { clientId },
      include: { serviceType: true },
      orderBy: { createdAt: "asc" },
    }),
    user.role === "ADMIN"
      ? prisma.serviceType.findMany({ where: { isArchived: false }, orderBy: { order: "asc" } })
      : Promise.resolve([]),
  ]);

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Services</CardTitle>
          {isAdmin ? <ClientServiceFormDialog clientId={clientId} serviceTypes={serviceTypes} /> : null}
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No services attached yet"
              description="Attach the services you'll be carrying out for this client, e.g. eBay management or website management."
            />
          ) : (
            <ClientServiceList
              clientId={clientId}
              isAdmin={isAdmin}
              services={services.map((s) => ({
                id: s.id,
                label: s.label,
                status: s.status,
                billingType: s.billingType,
                priceValue: s.priceValue ? Number(s.priceValue) : null,
                serviceType: s.serviceType,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
