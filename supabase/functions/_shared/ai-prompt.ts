// Shared between reschedule and place-task Edge Functions.
// Deno-compatible port of src/lib/ai-prompt.ts.
// Defines its own minimal UserPreferences type (Deno can't see src/types/).

export type UserPreferences = {
  userId: string;
  productivityPeak: "morning" | "afternoon" | "evening" | "varies";
  wakeUpTime: string; // "HH:MM"
  schedulingContext: string;
  onboardingCompleted: boolean;
  persona: string | null;
  sleepTime: string | null; // "HH:MM"
  painPoints: string[] | null;
  hardConstraints: string[] | null;
};

const PERSONA_LABEL_MAP: Record<string, string> = {
  student: "Student",
  professional: "Professional / office worker",
  parent: "Parent managing a household",
  freelancer: "Freelancer / self-employed",
  shift_worker: "Shift worker or irregular hours",
};

const PEAK_LABEL_MAP: Record<string, string> = {
  morning: "morning (sharpest before noon)",
  afternoon: "afternoon (midday stride)",
  evening: "evening (comes alive after 5 PM)",
  varies: "varies day to day",
};

const CONSTRAINT_LABEL_MAP: Record<string, string> = {
  morning_routine: "morning routine / gym",
  school: "school or class schedule",
  work_hours: "work hours",
  childcare: "childcare or pickups",
  medical: "medication or appointments",
};

function formatConstraints(prefs: UserPreferences): string {
  if (!prefs.hardConstraints || prefs.hardConstraints.length === 0) {
    return "No prioritized tasks.";
  }
  if (prefs.hardConstraints.includes("none")) {
    return "No prioritized tasks — full flexibility.";
  }
  return (
    "Prioritize these tasks: " +
    prefs.hardConstraints.map((c) => CONSTRAINT_LABEL_MAP[c] ?? c).join(", ") +
    ". Schedule these around their natural times when possible, but if the user explicitly asks to move them, you must comply."
  );
}

/**
 * Build a system prompt fragment from onboarding-completed user preferences.
 * Returns empty string if onboarding is incomplete.
 */
export function buildSystemPrompt(prefs: UserPreferences): string {
  if (!prefs.onboardingCompleted) return "";

  const lines: string[] = [];

  if (prefs.persona && prefs.persona !== "other") {
    lines.push(
      `User profile: ${PERSONA_LABEL_MAP[prefs.persona] ?? prefs.persona}.`,
    );
  }

  if (prefs.wakeUpTime) {
    const sleep = prefs.sleepTime ?? "23:00";
    lines.push(
      `Alertness window: User is awake from ${prefs.wakeUpTime} to ${sleep}.`,
    );
  }

  lines.push(
    `Energy peak: ${PEAK_LABEL_MAP[prefs.productivityPeak] ?? prefs.productivityPeak}.`,
  );

  lines.push(formatConstraints(prefs));

  if (prefs.schedulingContext?.trim()) {
    lines.push(
      `Additional context from user: "${prefs.schedulingContext.trim()}"`,
    );
  }

  return lines.join("\n");
}
