export type UserPreferences = {
  userId: string;
  productivityPeak: 'morning' | 'afternoon' | 'evening' | 'varies';
  wakeUpTime: string; // "HH:MM" format
  schedulingContext: string; // freeform text
  onboardingCompleted: boolean;
  persona: string | null;
  sleepTime: string | null; // "HH:MM" format
  painPoints: string[];
  hardConstraints: string[];
};
