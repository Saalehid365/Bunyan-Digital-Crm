import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, FileText, MessageSquare, MoveRight, PlusCircle, Pencil, Receipt } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { ActivityType } from "@prisma/client";

export type TimelineEntry = {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: Date;
  userName: string | null;
  clientName?: string;
};

const ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  NOTE: MessageSquare,
  STAGE_CHANGE: MoveRight,
  CREATED: PlusCircle,
  COMPLETED: CheckCircle2,
  CLIENT_UPDATED: Pencil,
  TIME_LOGGED: Clock,
  QUOTE_STATUS_CHANGE: FileText,
  INVOICE_STATUS_CHANGE: Receipt,
};

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No activity yet"
        description="Stage changes, notes, and completed work will appear here as it happens."
      />
    );
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry, i) => {
        const Icon = ICONS[entry.type];
        return (
          <li key={entry.id} className="relative flex gap-3 pb-5 pl-1 last:pb-0">
            {i < entries.length - 1 ? (
              <span className="absolute left-[15px] top-6 h-full w-px bg-border" />
            ) : null}
            <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm text-foreground">
                {entry.message}
                {entry.clientName ? (
                  <span className="text-muted-foreground"> · {entry.clientName}</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
