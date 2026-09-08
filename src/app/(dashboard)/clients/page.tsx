import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireUser, getVisibleClientIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { ServiceTypeBadge } from "@/components/services/service-type-badge";
import { EmptyState } from "@/components/empty-state";

export default async function ClientsPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const clientIds = isAdmin ? undefined : await getVisibleClientIds(user.id);

  const clients = await prisma.client.findMany({
    where: clientIds ? { id: { in: clientIds } } : {},
    orderBy: { createdAt: "desc" },
    include: {
      services: {
        where: { status: "ACTIVE" },
        include: { serviceType: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length === 1 ? "" : "s"}
            {isAdmin ? "" : " assigned to you"}
          </p>
        </div>
        {isAdmin ? (
          <Button asChild size="sm">
            <Link href="/clients/new">
              <Plus className="h-4 w-4" /> New client
            </Link>
          </Button>
        ) : null}
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={isAdmin ? "No clients yet" : "No clients assigned to you yet"}
          description={
            isAdmin
              ? "Add your first client to start tracking services and work."
              : "Ask an admin to assign you to a client."
          }
          action={
            isAdmin ? (
              <Button asChild size="sm">
                <Link href="/clients/new">
                  <Plus className="h-4 w-4" /> New client
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="cursor-pointer">
                  <TableCell className="p-0">
                    <Link href={`/clients/${client.id}`} className="block px-4 py-3">
                      <p className="font-medium text-foreground">{client.name}</p>
                      {client.companyName ? (
                        <p className="text-xs text-muted-foreground">{client.companyName}</p>
                      ) : null}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="block py-3">
                      <ClientStatusBadge status={client.status} />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="block py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {client.services.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          client.services.map((s) => (
                            <ServiceTypeBadge
                              key={s.id}
                              name={s.serviceType.name}
                              colorHex={s.serviceType.colorHex}
                            />
                          ))
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="block py-3 text-sm text-muted-foreground">
                      {client.contactName || client.contactEmail || "—"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
