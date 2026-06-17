export type UserPreferences = {
  userId: string;
  wakeUpTime: string; // "HH:MM" format
  sleepTime: string; // "HH:MM" format
  userContext: string; // freeform text built from onboarding, editable in settings
  onboardingCompleted: boolean;
};
