import { cn } from "@/lib/utils";
import { CLIENT_STATUS_LABEL } from "@/lib/constants";
import type { ClientStatus } from "@prisma/client";

const STYLES: Record<ClientStatus, string> = {
  LEAD: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-success/15 text-success border-success/30",
  PAUSED: "bg-primary/10 text-primary border-primary/30",
  CHURNED: "bg-destructive/10 text-destructive border-destructive/30",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {CLIENT_STATUS_LABEL[status]}
    </span>
  );
}
