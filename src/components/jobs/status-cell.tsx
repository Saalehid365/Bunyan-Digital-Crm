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

export const STAGE_FILL: Record<JobStage, string> = {
  BACKLOG: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-gradient-primary text-primary-foreground",
  IN_REVIEW: "bg-gradient-review text-white",
  DONE: "bg-gradient-success text-success-foreground",
};

export const STAGE_DOT: Record<JobStage, string> = {
  BACKLOG: "bg-muted-foreground/50",
  IN_PROGRESS: "bg-primary",
  IN_REVIEW: "bg-[var(--chart-2)]",
  DONE: "bg-success",
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
          "flex h-8 w-full items-center justify-center gap-1 rounded-[var(--radius-sm)] text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-150 hover:opacity-90 hover:shadow-[0_2px_6px_rgba(0,0,0,0.14)] disabled:opacity-60",
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
