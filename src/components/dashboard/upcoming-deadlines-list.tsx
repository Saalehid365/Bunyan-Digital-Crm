import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

type DeadlineTask = {
  id: string;
  title: string;
  dueDate: Date;
  clientId: string;
  clientName: string;
};

export function UpcomingDeadlinesList({ tasks }: { tasks: DeadlineTask[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing due soon"
        description="Tasks with a due date in the next 14 days will show up here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => {
        const overdue = isPast(task.dueDate) && !isToday(task.dueDate);
        return (
          <li key={task.id}>
            <Link
              href={`/clients/${task.clientId}/board`}
              className="flex items-center justify-between gap-4 px-1 py-2.5 text-sm hover:bg-accent/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{task.title}</p>
                <p className="truncate text-xs text-muted-foreground">{task.clientName}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-xs tabular-nums",
                  overdue ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {format(task.dueDate, "d MMM")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
