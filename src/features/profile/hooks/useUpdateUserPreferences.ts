import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateUserPreferences,
  type UserPreferencesUpdate,
} from "@/features/profile/api";

type UpdatePayload = {
  userId: string;
  update: UserPreferencesUpdate;
};

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, update }: UpdatePayload) =>
      updateUserPreferences(userId, update),
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
    },
  });
}
