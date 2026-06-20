import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIncompleteTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/features/schedule/api";
import { placeTask } from "@/services/ai";
import { useUndoStore } from "@/store/undo-store";
import { useToast } from "@/providers/toast-provider";
import { RESCHEDULE_CONSTANTS } from "@/constants/reschedule";
import type { Task } from "@/types/task";

export type PlaceTaskParams =
  | {
      taskData: {
        name: string;
        durationMinutes: number;
        deadline: string | null;
        aiContext: string | null;
      };
      whatChanged: string;
      mode: "add";
      previousTask?: undefined;
      existingTaskId?: string;
    }
  | {
      taskData: {
        name: string;
        durationMinutes: number;
        deadline: string | null;
        aiContext: string | null;
      };
      whatChanged: string;
      mode: "edit";
      previousTask: Task;
      existingTaskId: string;
    };

type UndoMeta = {
  mode: "add" | "edit";
  createdTaskId?: string;
  previousTask?: Task;
};

export function usePlaceTask() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const undoStore = useUndoStore();
  const undoMetaRef = useRef<UndoMeta | null>(null);

  async function handleUndo() {
    const snapshot = useUndoStore.getState().snapshot;
    if (!snapshot) return;
    undoStore.cancelTimeout();

    try {
      const meta = undoMetaRef.current;

      if (meta?.mode === "add" && meta.createdTaskId) {
        await deleteTask(meta.createdTaskId);
      } else if (meta?.mode === "edit" && meta.previousTask) {
        await updateTask(meta.previousTask.id, {
          name: meta.previousTask.name,
          startTime: meta.previousTask.startTime,
          endTime: meta.previousTask.endTime,
          durationMinutes: meta.previousTask.durationMinutes,
          deadline: meta.previousTask.deadline,
          aiContext: meta.previousTask.aiContext,
          aiDecidesTime: meta.previousTask.aiDecidesTime,
          aiJustification: meta.previousTask.aiJustification,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      undoMetaRef.current = null;
      undoStore.clearSnapshot();
      toast.hide();
    } catch {
      toast.show({ message: "Couldn't undo. Please try again." });
    }
  }

  const mutation = useMutation({
    mutationFn: async (params: PlaceTaskParams) => {
      const { taskData, whatChanged, mode, previousTask, existingTaskId } =
        params;

      // Fetch existing tasks for AI context
      const existingTasks = await fetchIncompleteTasks();

      const existingTasksPayload = existingTasks.map((t) => ({
        id: t.id,
        name: t.name,
        startTime: t.startTime,
        endTime: t.endTime,
      }));

      // Call AI to find a slot
      const result = await placeTask(
        {
          id: existingTaskId || "new-task",
          name: taskData.name,
          durationMinutes: taskData.durationMinutes,
          deadline: taskData.deadline,
          aiContext: taskData.aiContext,
        },
        existingTasksPayload,
        "",
        whatChanged,
      );

      if (mode === "add") {
        // Create task with AI-assigned times
        const created = await createTask({
          name: taskData.name,
          startTime: result.startTime,
          endTime: result.endTime,
          durationMinutes: result.durationMinutes,
          deadline: result.deadline,
          aiContext: result.aiContext,
          aiDecidesTime: true,
          aiJustification: result.aiJustification,
        });
        undoMetaRef.current = { mode: "add", createdTaskId: created.id };
        return created;
      } else {
        // Update existing task with AI-assigned times
        const editId = (params as { existingTaskId: string }).existingTaskId;
        const editPrev = (params as { previousTask: Task }).previousTask;
        const updated = await updateTask(editId, {
          name: taskData.name,
          startTime: result.startTime,
          endTime: result.endTime,
          durationMinutes: result.durationMinutes,
          deadline: result.deadline,
          aiContext: result.aiContext,
          aiDecidesTime: true,
          aiJustification: result.aiJustification,
        });
        undoMetaRef.current = { mode: "edit", previousTask: editPrev };
        return updated;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // Set a non-null snapshot so the undo system knows undo is available
      undoStore.setSnapshot([{} as Task]);
      toast.show({
        message: "Task placed",
        actionLabel: "Undo",
        onAction: handleUndo,
        duration: RESCHEDULE_CONSTANTS.TOAST_DURATION_MS,
      });
      undoStore.startTimeout(() => {
        undoMetaRef.current = null;
        undoStore.clearSnapshot();
      }, RESCHEDULE_CONSTANTS.UNDO_TIMEOUT_MS);
    },
    onError: () => {
      undoMetaRef.current = null;
      undoStore.clearSnapshot();
      toast.show({ message: "Couldn't place task. Please try again." });
    },
  });

  return mutation;
}
