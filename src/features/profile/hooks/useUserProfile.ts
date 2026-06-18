import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  fetchUserPreferences,
  fetchUserProfile,
  type UserProfile,
} from "@/features/profile/api";
import type { UserPreferences } from "@/types/userPreferences";

export type UseUserProfileResult = {
  isLoading: boolean;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  profileError: Error | null;
  preferencesError: Error | null;
  initials: string;
};

function computeInitials(profile: UserProfile | null): string {
  if (!profile) return "";
  const source = profile.name?.trim() || profile.email.split("@")[0] || "";
  if (!source) return "";

  // Split on whitespace; take first letter of first two words
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function useUserProfile(): UseUserProfileResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const profileQuery = useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    enabled: !!userId,
  });

  const preferencesQuery = useQuery<UserPreferences>({
    queryKey: ["userPreferences", userId],
    queryFn: () => fetchUserPreferences(userId!),
    enabled: !!userId,
  });

  const initials = useMemo(
    () => computeInitials(profileQuery.data ?? null),
    [profileQuery.data],
  );

  return {
    isLoading: profileQuery.isLoading || preferencesQuery.isLoading,
    profile: profileQuery.data ?? null,
    preferences: preferencesQuery.data ?? null,
    profileError: profileQuery.error as Error | null,
    preferencesError: preferencesQuery.error as Error | null,
    initials,
  };
}
