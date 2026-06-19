import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/schedule/api";
import { useToast } from "@/providers/toast-provider";
import type { Task } from "@/types/task";

const TASKS_QUERY_KEY = ["tasks"] as const;

function tasksQueryKey(date: Date): readonly [string, string] {
  return ["tasks", date.toISOString().slice(0, 10)] as const;
}

export function useTasks(date: Date, authLoading: boolean) {
  return useQuery({
    queryKey: tasksQueryKey(date),
    queryFn: () => api.fetchTasks(date),
    enabled: !authLoading,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Partial<Task>) => api.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      api.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
    onError: () => {
      toast.show({ message: "Couldn't delete task." });
    },
  });
}

export function useToggleComplete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      id,
      completed,
    }: {
      id: string;
      completed: boolean;
    }) => api.toggleTaskComplete(id, completed),
    onMutate: async ({ id, completed }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: TASKS_QUERY_KEY,
      });

      // Optimistically update all task lists
      queryClient.setQueriesData<Task[]>(
        { queryKey: TASKS_QUERY_KEY },
        (old) =>
          old?.map((task) =>
            task.id === id ? { ...task, completed } : task,
          ) ?? [],
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.show({ message: "Couldn't update task." });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}
