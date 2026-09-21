"use client";

import { useTransition } from "react";
import { Trash2, Repeat, RepeatOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ServiceTypeBadge } from "@/components/services/service-type-badge";
import { SERVICE_STATUS_LABEL, GBP } from "@/lib/constants";
import {
  updateClientServiceStatus,
  updateClientServiceAutoInvoice,
  deleteClientService,
} from "@/server/actions/services";
import type { BillingType, ServiceStatus } from "@prisma/client";

type ClientService = {
  id: string;
  label: string | null;
  status: ServiceStatus;
  billingType: BillingType;
  priceValue: number | null;
  autoInvoice: boolean;
  serviceType: { name: string; colorHex: string };
};

export function ClientServiceList({
  clientId,
  services,
  canManageServices,
}: {
  clientId: string;
  services: ClientService[];
  canManageServices: boolean;
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
            {service.billingType === "ONE_OFF" ? (
              <span className="rounded-[var(--radius-sm)] border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                One-off
              </span>
            ) : null}
            {service.priceValue ? (
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {GBP.format(service.priceValue)}
                {service.billingType === "MONTHLY" ? "/mo" : ""}
              </span>
            ) : null}
            {canManageServices ? (
              <>
                {service.billingType === "MONTHLY" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      service.autoInvoice ? "text-primary" : "text-muted-foreground",
                    )}
                    disabled={pending}
                    title={
                      service.autoInvoice
                        ? "Auto-invoiced monthly — click to turn off"
                        : "Auto-invoicing off — click to turn on"
                    }
                    onClick={() =>
                      startTransition(() =>
                        updateClientServiceAutoInvoice(service.id, clientId, !service.autoInvoice).then(() => {}),
                      )
                    }
                  >
                    {service.autoInvoice ? <Repeat className="h-3.5 w-3.5" /> : <RepeatOff className="h-3.5 w-3.5" />}
                  </Button>
                ) : null}
                <Select
                  value={service.status}
                  disabled={pending}
                  onValueChange={(value) =>
                    startTransition(() =>
                      updateClientServiceStatus(service.id, clientId, value as ServiceStatus).then(() => {}),
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
                  onClick={() => startTransition(() => deleteClientService(service.id, clientId).then(() => {}))}
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
