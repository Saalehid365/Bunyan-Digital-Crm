import { notFound } from "next/navigation";
import { requireUser, getClientForUser, hasPermission } from "@/lib/permissions";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { ClientTabs } from "@/components/clients/client-tabs";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();
  const canManageBilling = await hasPermission(user, "MANAGE_BILLING");

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-5 md:px-6">
        <div className="flex items-center gap-3">
          <ClientAvatar name={client.name} className="h-10 w-10 text-sm" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">{client.name}</h1>
              <ClientStatusBadge status={client.status} />
            </div>
            {client.companyName ? (
              <p className="text-sm text-muted-foreground">{client.companyName}</p>
            ) : null}
          </div>
        </div>
      </div>
      <ClientTabs clientId={clientId} canManageBilling={canManageBilling} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
