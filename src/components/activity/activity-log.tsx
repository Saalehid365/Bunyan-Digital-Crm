"use client";

import { useMemo, useState } from "react";
import { Filter, X } from "lucide-react";
import { MultiSelectFilter } from "@/components/jobs/multi-select-filter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { Timeline, type TimelineEntry } from "./timeline";
import { ACTIVITY_TYPE_LABEL } from "@/lib/constants";

const TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_LABEL).map(([value, label]) => ({ value, label }));

export function ActivityLog({ entries }: { entries: TimelineEntry[] }) {
  const [types, setTypes] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const assigneeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      const key = e.userId ?? "system";
      if (!seen.has(key)) seen.set(key, e.userName ?? "System");
    }
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [entries]);

  const filtered = useMemo(() => {
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

    return entries.filter((e) => {
      if (types.length > 0 && !types.includes(e.type)) return false;
      if (assignees.length > 0 && !assignees.includes(e.userId ?? "system")) return false;
      const t = e.createdAt.getTime();
      if (fromTime !== null && t < fromTime) return false;
      if (toTime !== null && t > toTime) return false;
      return true;
    });
  }, [entries, types, assignees, from, to]);

  const hasFilters = types.length > 0 || assignees.length > 0 || from !== "" || to !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectFilter label="Type" options={TYPE_OPTIONS} selected={types} onChange={setTypes} />
        <MultiSelectFilter
          label="Assignee"
          options={assigneeOptions}
          selected={assignees}
          onChange={setAssignees}
        />
        <div className="flex items-center gap-1.5">
          <Label htmlFor="activity-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="activity-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 w-[9.5rem] text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Label htmlFor="activity-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="activity-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 w-[9.5rem] text-xs"
          />
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setTypes([]);
              setAssignees([]);
              setFrom("");
              setTo("");
            }}
            className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        ) : null}
      </div>

      {hasFilters ? (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {entries.length}
        </p>
      ) : null}

      {hasFilters && filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No activity matches these filters"
          description="Try widening the date range or clearing a filter."
        />
      ) : (
        <Timeline entries={filtered} />
      )}
    </div>
  );
}
