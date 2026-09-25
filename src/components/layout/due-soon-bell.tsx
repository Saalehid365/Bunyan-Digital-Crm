"use client";

import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Bell, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DueSoonJob } from "@/lib/due-soon-jobs";
import type { NewApplications } from "@/lib/revenue-finder-alerts";

function dueLabel(job: DueSoonJob): string {
  const days = differenceInCalendarDays(new Date(job.dueDate), new Date());
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

export function DueSoonBell({
  jobs,
  applications = { count: 0, items: [] },
}: {
  jobs: DueSoonJob[];
  applications?: NewApplications;
}) {
  const hasJobs = jobs.length > 0;
  const hasApps = applications.count > 0;
  const total = jobs.length + applications.count;
  const overdueCount = jobs.filter((j) => j.overdue).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Alerts"
        >
          <Bell className="h-4 w-4" />
          {total > 0 ? (
            <span
              className={cn(
                "absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white",
                overdueCount > 0 ? "bg-destructive" : "bg-primary",
              )}
            >
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3.5 py-2.5">
          <p className="text-sm font-medium text-foreground">Alerts</p>
          <p className="text-xs text-muted-foreground">
            {hasJobs || hasApps ? "New applications, and open jobs that are overdue or due soon." : "You're all caught up."}
          </p>
        </div>
        {hasApps ? (
          <div className="border-b border-border">
            <p className="px-3.5 pt-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Revenue Finder
            </p>
            <ul className="max-h-48 divide-y divide-border overflow-y-auto">
              {applications.items.map((a) => (
                <li key={a.id}>
                  <Link href="/revenue-finder" className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-accent/50">
                    <Radar className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{a.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {a.storeUrl.replace(/^https?:\/\//, "")}
                      </span>
                    </span>
                    <span className="ml-auto shrink-0 text-xs font-medium text-primary">New</span>
                  </Link>
                </li>
              ))}
            </ul>
            {applications.count > applications.items.length ? (
              <Link href="/revenue-finder" className="block px-3.5 pb-2.5 text-xs text-primary hover:underline">
                +{applications.count - applications.items.length} more
              </Link>
            ) : null}
          </div>
        ) : null}
        {hasJobs ? (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/clients/${job.clientId}/board`}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-accent/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{job.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{job.clientName}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium tabular-nums",
                      job.overdue ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {dueLabel(job)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
