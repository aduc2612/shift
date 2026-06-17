export const ONBOARDING_SCREENS = [
  "identity",
  "persona-review",
  "pain-points",
  "animation",
  "sleep-wake",
  "energy-peak",
  "hard-constraints",
  "freeform",
  "progress-graph",
  "processing-theatre",
  "schedule-preview",
  "notif-warmup",
  "notif-permission",
] as const;

export type OnboardingScreen = (typeof ONBOARDING_SCREENS)[number];

export function getNextScreen(
  current: OnboardingScreen,
): OnboardingScreen | null {
  const idx = ONBOARDING_SCREENS.indexOf(current);
  return idx < ONBOARDING_SCREENS.length - 1
    ? ONBOARDING_SCREENS[idx + 1]
    : null;
}

export function getScreenStep(screen: OnboardingScreen): number {
  return ONBOARDING_SCREENS.indexOf(screen) + 1;
}

export const ONBOARDING_TOTAL = ONBOARDING_SCREENS.length;
