"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { JobCard } from "./job-card";
import { STAGE_DOT } from "@/components/jobs/status-cell";
import type { KanbanJob } from "./types";
import type { JobStage } from "@prisma/client";

export function Column({
  stage,
  label,
  jobs,
  showClient,
  onAddJob,
  onJobClick,
}: {
  stage: JobStage;
  label: string;
  jobs: KanbanJob[];
  showClient: boolean;
  onAddJob?: (stage: JobStage) => void;
  onJobClick: (job: KanbanJob) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${stage}` });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STAGE_DOT[stage])} />
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{jobs.length}</span>
        </div>
        {onAddJob ? (
          <button
            onClick={() => onAddJob(stage)}
            className="rounded-[var(--radius-sm)] p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="mb-2 h-px bg-border" />
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-[var(--radius-lg)] p-1 transition-colors",
          isOver ? "bg-accent/40" : "",
        )}
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              showClient={showClient}
              onClick={() => onJobClick(job)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
