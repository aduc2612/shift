export type Task = {
  id: string; // uuid
  userId: string;
  name: string;
  startTime: string; // ISO 8601, e.g. "2025-06-10T08:00:00"
  endTime: string; // ISO 8601
  durationMinutes: number;
  deadline: string | null; // ISO 8601 date
  completed: boolean;
  aiContext: string | null; // user-visible, user-editable notes the AI uses for scheduling
  aiDecidesTime: boolean; // if true, AI sets start/end times; user time inputs disabled
  aiJustification: string | null; // visible — why the AI placed this task here
  createdAt: string;
  updatedAt: string;
};
