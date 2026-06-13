import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIncompleteTasks, batchUpdateTasks } from '@/features/schedule/api';
import { rescheduleTasks } from '@/services/ai';
import { useUndoStore } from '@/store/undo-store';
import { useToast } from '@/providers/toast-provider';
import { RESCHEDULE_CONSTANTS } from '@/constants/reschedule';

export function useReschedule() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const undoStore = useUndoStore();

  async function handleUndo() {
    const snapshot = useUndoStore.getState().snapshot;
    if (!snapshot) return;
    undoStore.cancelTimeout();
    await batchUpdateTasks(
      snapshot.map(t => ({
        id: t.id,
        startTime: t.startTime,
        endTime: t.endTime,
        durationMinutes: t.durationMinutes,
        aiJustification: t.aiJustification ?? '',
        aiContext: t.aiContext ?? '',
      })),
    );
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    undoStore.clearSnapshot();
    toast.hide();
  }

  const mutation = useMutation({
    mutationFn: async ({ whatChanged }: { whatChanged: string }) => {
      const tasks = await fetchIncompleteTasks();
      undoStore.setSnapshot(tasks);
      const result = await rescheduleTasks(tasks, '', whatChanged);
      return batchUpdateTasks(result);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.show({
        message: 'Schedule updated',
        actionLabel: 'Undo',
        onAction: handleUndo,
        duration: RESCHEDULE_CONSTANTS.TOAST_DURATION_MS,
      });
      undoStore.startTimeout(
        () => undoStore.clearSnapshot(),
        RESCHEDULE_CONSTANTS.UNDO_TIMEOUT_MS,
      );
    },
    onError: () => {
      undoStore.clearSnapshot();
    },
  });

  return mutation;
}
