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
import { TASK_STAGES } from "@/lib/constants";
import { moveTaskStage } from "@/server/actions/tasks";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { TaskFormDialog } from "./task-form-dialog";
import type { KanbanTask } from "./types";
import type { TaskStage } from "@prisma/client";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };

export function Board({
  initialTasks,
  showClient,
  clientId,
  assignableUsers,
  clientServicesByClient,
}: {
  initialTasks: KanbanTask[];
  showClient: boolean;
  /** Fixed client scope for a per-client board. Omit for the cross-client global board. */
  clientId?: string;
  assignableUsers: AssignableUser[];
  clientServicesByClient: Record<string, ClientServiceOption[]>;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  // Re-sync local (optimistically-mutated) task state whenever the server gives us a fresh
  // initialTasks prop (e.g. after a create/edit revalidates this route). Doing this as a
  // render-time prop/state comparison (React's documented pattern) rather than in a useEffect
  // avoids an extra render pass.
  const [syncedTasks, setSyncedTasks] = useState(initialTasks);
  if (initialTasks !== syncedTasks) {
    setSyncedTasks(initialTasks);
    setTasks(initialTasks);
  }
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    stage: TaskStage;
    task: KanbanTask | null;
    clientId: string;
  }>({ open: false, stage: "BACKLOG", task: null, clientId: clientId ?? "" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(() => {
    const map = new Map<TaskStage, KanbanTask[]>();
    for (const s of TASK_STAGES) map.set(s.value, []);
    for (const t of tasks) map.get(t.stage)?.push(t);
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id) ?? null;
    setActiveTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overId = String(over.id);
    const destStage = overId.startsWith("col-")
      ? (overId.replace("col-", "") as TaskStage)
      : tasks.find((t) => t.id === overId)?.stage;
    if (!destStage) return;

    const others = (columns.get(destStage) ?? []).filter((t) => t.id !== activeTask.id);
    const overTaskIndex = overId.startsWith("col-")
      ? others.length
      : others.findIndex((t) => t.id === overId);
    const insertIndex = overTaskIndex === -1 ? others.length : overTaskIndex;

    const prev = others[insertIndex - 1];
    const next = others[insertIndex];
    let newPosition: number;
    if (!prev && !next) newPosition = 1024;
    else if (!prev) newPosition = next.position - 512;
    else if (!next) newPosition = prev.position + 1024;
    else newPosition = (prev.position + next.position) / 2;

    if (activeTask.stage === destStage && activeTask.position === newPosition) return;

    const previousTasks = tasks;
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === activeTask.id ? { ...t, stage: destStage, position: newPosition } : t,
      ),
    );

    moveTaskStage({ taskId: activeTask.id, stage: destStage, position: newPosition }).then(
      (result) => {
        if (result?.error) {
          setTasks(previousTasks);
          toast.error(result.error);
        }
      },
    );
  }

  function openCreateDialog(stage: TaskStage) {
    if (!clientId) return;
    setDialogState({ open: true, stage, task: null, clientId });
  }

  function openEditDialog(task: KanbanTask) {
    setDialogState({ open: true, stage: task.stage, task, clientId: task.clientId });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-5 overflow-x-auto p-4 md:p-6">
          {TASK_STAGES.map((s) => (
            <Column
              key={s.value}
              stage={s.value}
              label={s.label}
              tasks={columns.get(s.value) ?? []}
              showClient={showClient}
              onAddTask={clientId ? openCreateDialog : undefined}
              onTaskClick={openEditDialog}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} showClient={showClient} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <TaskFormDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        clientId={dialogState.clientId}
        defaultStage={dialogState.stage}
        task={dialogState.task}
        assignableUsers={assignableUsers}
        clientServices={clientServicesByClient[dialogState.clientId] ?? []}
        onDone={() => setDialogState((s) => ({ ...s, open: false }))}
      />
    </>
  );
}
