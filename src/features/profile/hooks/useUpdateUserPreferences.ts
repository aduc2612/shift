import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateUserPreferences,
  type UserPreferencesUpdate,
} from "@/features/profile/api";
import { useToast } from "@/providers/toast-provider";

type UpdatePayload = {
  userId: string;
  update: UserPreferencesUpdate;
};

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, update }: UpdatePayload) =>
      updateUserPreferences(userId, update),
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
    },
    onError: () => {
      toast.show({ message: "Couldn't save changes. Please try again." });
    },
  });
}
