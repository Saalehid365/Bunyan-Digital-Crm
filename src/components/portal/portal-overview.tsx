"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, TrendingUp, Megaphone, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { GBP } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Result = { id: string; period: string; label: string; value: string; change: string | null };
type Campaign = {
  id: string;
  name: string;
  platform: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate: string | null;
  endDate: string | null;
  spend: number | null;
  revenue: number | null;
  roas: number | null;
  notes: string | null;
};
type Report = { id: string; title: string; period: string | null; url: string; summary: string | null; createdAt: string };

const CAMPAIGN_STATUS_FILL: Record<Campaign["status"], string> = {
  ACTIVE: "bg-success/15 text-success",
  PAUSED: "bg-muted text-muted-foreground",
  COMPLETED: "bg-primary/15 text-primary",
};

const TABS = ["results", "campaigns", "reports"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { results: "Results", campaigns: "Campaigns", reports: "Reports" };

export function PortalOverview({
  results,
  campaigns,
  reports,
}: {
  results: Result[];
  campaigns: Campaign[];
  reports: Report[];
}) {
  const [tab, setTab] = useState<Tab>("results");

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted-foreground hover:text-foreground",
            )}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "results" ? (
        results.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No results yet" description="Your account manager will publish your store's key numbers here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <Card key={r.id}>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">{r.period} &middot; {r.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold tracking-tight">{r.value}</p>
                    {r.change ? (
                      <span className={cn("text-sm font-medium", r.change.trim().startsWith("-") ? "text-destructive" : "text-success")}>
                        {r.change}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {tab === "campaigns" ? (
        campaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns yet" description="Campaigns we're running for your store will appear here." />
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <Card key={c.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.platform}
                        {c.startDate ? ` · from ${format(new Date(c.startDate), "d MMM yyyy")}` : ""}
                      </p>
                    </div>
                    <Badge className={cn("border-0", CAMPAIGN_STATUS_FILL[c.status])}>{c.status}</Badge>
                  </div>
                  {c.spend != null || c.revenue != null || c.roas != null ? (
                    <div className="flex flex-wrap gap-5 border-t border-white/10 pt-3 text-sm">
                      {c.spend != null ? <div><span className="text-muted-foreground">Spend </span>{GBP.format(c.spend)}</div> : null}
                      {c.revenue != null ? <div><span className="text-muted-foreground">Revenue </span>{GBP.format(c.revenue)}</div> : null}
                      {c.roas != null ? <div><span className="text-muted-foreground">ROAS </span>{c.roas}x</div> : null}
                    </div>
                  ) : null}
                  {c.notes ? <p className="text-sm text-muted-foreground">{c.notes}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {tab === "reports" ? (
        reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Monthly reports and scorecards will be linked here as they're ready." />
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="block">
                <Card className="transition-colors hover:border-white/25">
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.period ? `${r.period} · ` : ""}
                        {format(new Date(r.createdAt), "d MMM yyyy")}
                      </p>
                      {r.summary ? <p className="mt-1 truncate text-sm text-muted-foreground">{r.summary}</p> : null}
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
