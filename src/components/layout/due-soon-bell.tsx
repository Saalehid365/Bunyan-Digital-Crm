"use client";

import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DueSoonJob } from "@/lib/due-soon-jobs";

function dueLabel(job: DueSoonJob): string {
  const days = differenceInCalendarDays(new Date(job.dueDate), new Date());
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

export function DueSoonBell({ jobs }: { jobs: DueSoonJob[] }) {
  const hasJobs = jobs.length > 0;
  const overdueCount = jobs.filter((j) => j.overdue).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Jobs due soon"
        >
          <Bell className="h-4 w-4" />
          {hasJobs ? (
            <span
              className={cn(
                "absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white",
                overdueCount > 0 ? "bg-destructive" : "bg-primary",
              )}
            >
              {jobs.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3.5 py-2.5">
          <p className="text-sm font-medium text-foreground">Due soon</p>
          <p className="text-xs text-muted-foreground">
            {hasJobs ? "Open jobs that are overdue or due in the next few days." : "You're all caught up."}
          </p>
        </div>
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
