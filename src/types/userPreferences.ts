export type UserPreferences = {
  userId: string;
  productivityPeak: 'morning' | 'afternoon' | 'evening' | 'varies';
  wakeUpTime: string; // "HH:MM" format
  schedulingContext: string; // freeform text
};
