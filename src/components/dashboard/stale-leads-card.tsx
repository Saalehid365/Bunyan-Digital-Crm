import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StaleLead } from "@/lib/stale-leads";

const TIER_STYLES: Record<StaleLead["tier"], string> = {
  5: "bg-muted text-muted-foreground border-border",
  7: "bg-primary/10 text-primary border-primary/30",
  10: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StaleLeadsCard({ leads, style }: { leads: StaleLead[]; style?: React.CSSProperties }) {
  if (leads.length === 0) return null;

  return (
    <Card className="rise" style={style}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Stale leads
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/clients/${lead.id}`}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-1.5 -mx-2 text-sm transition-colors hover:bg-muted/60"
          >
            <span className="min-w-0 truncate text-foreground">
              {lead.name}
              {lead.companyName ? (
                <span className="text-muted-foreground"> · {lead.companyName}</span>
              ) : null}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium tabular-nums",
                TIER_STYLES[lead.tier],
              )}
            >
              {lead.daysSinceLastTouch}d no contact
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
