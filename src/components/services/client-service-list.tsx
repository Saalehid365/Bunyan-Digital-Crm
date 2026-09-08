"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceTypeBadge } from "@/components/services/service-type-badge";
import { SERVICE_STATUS_LABEL, GBP } from "@/lib/constants";
import { updateClientServiceStatus, deleteClientService } from "@/server/actions/services";
import type { ServiceStatus } from "@prisma/client";

type ClientService = {
  id: string;
  label: string | null;
  status: ServiceStatus;
  monthlyValue: number | null;
  serviceType: { name: string; colorHex: string };
};

export function ClientServiceList({
  clientId,
  services,
  isAdmin,
}: {
  clientId: string;
  services: ClientService[];
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="divide-y divide-border">
      {services.map((service) => (
        <li key={service.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2.5">
            <ServiceTypeBadge name={service.serviceType.name} colorHex={service.serviceType.colorHex} />
            {service.label ? (
              <span className="text-sm text-muted-foreground">{service.label}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {service.monthlyValue ? (
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {GBP.format(service.monthlyValue)}/mo
              </span>
            ) : null}
            {isAdmin ? (
              <>
                <Select
                  value={service.status}
                  disabled={pending}
                  onValueChange={(value) =>
                    startTransition(() =>
                      updateClientServiceStatus(service.id, clientId, value as ServiceStatus),
                    )
                  }
                >
                  <SelectTrigger size="sm" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_STATUS_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteClientService(service.id, clientId))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{SERVICE_STATUS_LABEL[service.status]}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
