import Link from "next/link";
import { format, isToday } from "date-fns";
import { CalendarClock, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { MyDayCalendly } from "@/lib/my-day-data";

export function CalendlyMeetingsCard({ calendly }: { calendly: MyDayCalendly }) {
  if (!calendly.connected) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Calendly isn't connected"
        description="Connect your Calendly account in Settings to see your upcoming meetings here."
        action={
          <Link href="/settings" className="text-xs font-medium text-primary hover:underline">
            Go to Settings
          </Link>
        }
      />
    );
  }

  if (calendly.error) {
    return <p className="text-sm text-muted-foreground">{calendly.error}</p>;
  }

  if (calendly.meetings.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing on your calendar for the next couple of weeks.</p>;
  }

  return (
    <ul className="space-y-1">
      {calendly.meetings.map((meeting) => {
        const start = new Date(meeting.startTime);
        return (
          <li key={meeting.uri} className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] px-1 py-1.5 hover:bg-accent/40">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{meeting.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isToday(start) ? "Today" : format(start, "EEE d MMM")} · {format(start, "HH:mm")} · {meeting.locationLabel}
                {meeting.inviteeCount > 0 ? ` · ${meeting.inviteeCount} invitee${meeting.inviteeCount === 1 ? "" : "s"}` : ""}
              </p>
            </div>
            {meeting.joinUrl ? (
              <a
                href={meeting.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Join <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
