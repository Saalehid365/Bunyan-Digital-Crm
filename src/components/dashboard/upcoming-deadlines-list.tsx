import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

type DeadlineJob = {
  id: string;
  title: string;
  dueDate: Date;
  clientId: string;
  clientName: string;
};

export function UpcomingDeadlinesList({ jobs }: { jobs: DeadlineJob[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing due soon"
        description="Jobs with a due date in the next 14 days will show up here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {jobs.map((job) => {
        const overdue = isPast(job.dueDate) && !isToday(job.dueDate);
        return (
          <li key={job.id}>
            <Link
              href={`/clients/${job.clientId}/board`}
              className="flex items-center justify-between gap-4 px-1 py-2.5 text-sm hover:bg-accent/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{job.title}</p>
                <p className="truncate text-xs text-muted-foreground">{job.clientName}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-xs tabular-nums",
                  overdue ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {format(job.dueDate, "d MMM")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
