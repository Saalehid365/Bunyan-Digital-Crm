"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { BOARD_STAGES } from "@/lib/constants";
import { moveJobStage } from "@/server/actions/jobs";
import { Column } from "./column";
import { JobCard } from "./job-card";
import type { KanbanJob } from "./types";
import type { JobStage } from "@prisma/client";

/** Pure Kanban rendering + drag-and-drop. Job creation/detail editing is handled by the
 * parent JobsView, which owns the job list state and the create dialog / detail sheet. */
export function Board({
  jobs,
  setJobs,
  showClient,
  canCreate,
  onAddJob,
  onJobClick,
}: {
  jobs: KanbanJob[];
  setJobs: (updater: (prev: KanbanJob[]) => KanbanJob[]) => void;
  showClient: boolean;
  canCreate: boolean;
  onAddJob: (stage: JobStage) => void;
  onJobClick: (job: KanbanJob) => void;
}) {
  const [activeJob, setActiveJob] = useState<KanbanJob | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(() => {
    const map = new Map<JobStage, KanbanJob[]>();
    for (const s of BOARD_STAGES) map.set(s.value, []);
    for (const j of jobs) map.get(j.stage)?.push(j);
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [jobs]);

  function handleDragStart(event: DragStartEvent) {
    const job = jobs.find((j) => j.id === event.active.id) ?? null;
    setActiveJob(job);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const activeJob = jobs.find((j) => j.id === active.id);
    if (!activeJob) return;

    const overId = String(over.id);
    const destStage = overId.startsWith("col-")
      ? (overId.replace("col-", "") as JobStage)
      : jobs.find((j) => j.id === overId)?.stage;
    if (!destStage) return;

    const others = (columns.get(destStage) ?? []).filter((j) => j.id !== activeJob.id);
    const overJobIndex = overId.startsWith("col-")
      ? others.length
      : others.findIndex((j) => j.id === overId);
    const insertIndex = overJobIndex === -1 ? others.length : overJobIndex;

    const prev = others[insertIndex - 1];
    const next = others[insertIndex];
    let newPosition: number;
    if (!prev && !next) newPosition = 1024;
    else if (!prev) newPosition = next.position - 512;
    else if (!next) newPosition = prev.position + 1024;
    else newPosition = (prev.position + next.position) / 2;

    if (activeJob.stage === destStage && activeJob.position === newPosition) return;

    const previousJobs = jobs;
    setJobs((prevJobs) =>
      prevJobs.map((j) =>
        j.id === activeJob.id ? { ...j, stage: destStage, position: newPosition } : j,
      ),
    );

    moveJobStage({ jobId: activeJob.id, stage: destStage, position: newPosition }).then(
      (result) => {
        if (result?.error) {
          setJobs(() => previousJobs);
          toast.error(result.error);
        }
      },
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-5 overflow-x-auto p-4 md:p-6">
        {BOARD_STAGES.map((s) => (
          <Column
            key={s.value}
            stage={s.value}
            label={s.label}
            jobs={columns.get(s.value) ?? []}
            showClient={showClient}
            onAddJob={canCreate ? onAddJob : undefined}
            onJobClick={onJobClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeJob ? <JobCard job={activeJob} showClient={showClient} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
