export type Task = {
  id: string; // uuid
  userId: string;
  name: string;
  startTime: string; // ISO 8601, e.g. "2025-06-10T08:00:00"
  endTime: string; // ISO 8601
  durationMinutes: number;
  deadline: string | null; // ISO 8601 date
  completed: boolean;
  aiContext: string | null; // hidden field — AI nuances only
  aiJustification: string | null; // visible — why the AI placed this task here
  createdAt: string;
  updatedAt: string;
};
