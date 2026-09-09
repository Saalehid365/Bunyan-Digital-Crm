"use client";

import { useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { JOB_STAGES, JOB_STAGE_LABEL } from "@/lib/constants";
import { moveJobStage } from "@/server/actions/jobs";
import type { JobStage } from "@prisma/client";

// Flat, light tints (not full-saturation fills, not gradient) — soft enough to sit in a
// dense grid without shouting, the color itself carried by the text.
export const STAGE_FILL: Record<JobStage, string> = {
  BACKLOG: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/15 text-primary",
  IN_REVIEW: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  DONE: "bg-success/15 text-success",
};

export const STAGE_DOT: Record<JobStage, string> = {
  BACKLOG: "bg-muted-foreground/50",
  IN_PROGRESS: "bg-primary",
  IN_REVIEW: "bg-[var(--chart-2)]",
  DONE: "bg-success",
};

export const STAGE_TEXT: Record<JobStage, string> = {
  BACKLOG: "text-foreground",
  IN_PROGRESS: "text-primary",
  IN_REVIEW: "text-[var(--chart-2)]",
  DONE: "text-success",
};

export const STAGE_BORDER: Record<JobStage, string> = {
  BACKLOG: "border-l-muted-foreground/40",
  IN_PROGRESS: "border-l-primary",
  IN_REVIEW: "border-l-[var(--chart-2)]",
  DONE: "border-l-success",
};

export function StatusCell({
  jobId,
  stage,
  position,
  className,
}: {
  jobId: string;
  stage: JobStage;
  position: number;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex h-full min-h-10 w-full items-center justify-center gap-1 text-xs font-semibold transition-opacity duration-150 hover:opacity-85 disabled:opacity-60",
          STAGE_FILL[stage],
          className,
        )}
      >
        {JOB_STAGE_LABEL[stage]}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        {JOB_STAGES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={(e) => {
              e.stopPropagation();
              startTransition(() => {
                moveJobStage({ jobId, stage: s.value, position });
              });
            }}
          >
            <span className={cn("h-2 w-2 rounded-full", STAGE_DOT[s.value])} />
            {s.label}
            {s.value === stage ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
