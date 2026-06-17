// Shared between reschedule and place-task Edge Functions.
// Deno-compatible port of src/lib/ai-prompt.ts.
// Defines its own minimal UserPreferences type (Deno can't see src/types/).

export type UserPreferences = {
  userId: string;
  wakeUpTime: string; // "HH:MM"
  sleepTime: string; // "HH:MM"
  userContext: string;
  onboardingCompleted: boolean;
};

const PEAK_LABEL_MAP: Record<string, string> = {
  morning: "morning (sharpest before noon)",
  afternoon: "afternoon (midday stride)",
  evening: "evening (comes alive after 5 PM)",
  varies: "varies day to day",
};

/**
 * Build a system prompt fragment from the user's stored context.
 * The `userContext` field is a freeform text block assembled client-side
 * during onboarding (see buildUserContextText in src/features/onboarding/utils.ts).
 * Returns empty string if onboarding is incomplete.
 */
export function buildSystemPrompt(prefs: UserPreferences): string {
  if (!prefs.onboardingCompleted) return "";

  const lines: string[] = [];

  if (prefs.wakeUpTime) {
    const sleep = prefs.sleepTime ?? "23:00";
    lines.push(
      `Alertness window: User is awake from ${prefs.wakeUpTime} to ${sleep}.`,
    );
  }

  if (prefs.userContext?.trim()) {
    lines.push(prefs.userContext.trim());
  }

  return lines.join("\n");
}
