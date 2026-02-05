export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  archived: boolean;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  projectIds: string[];
  duration: number; // in seconds
  date: string; // ISO date string YYYY-MM-DD
  startTime: string | null; // ISO datetime
  endTime: string | null; // ISO datetime
  notes: string | null;
  referenceLinks: string[];
  tags: string[];
  source: "timer" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

export interface TimerState {
  status: "idle" | "running" | "paused";
  elapsed: number; // seconds
  startedAt: number | null; // timestamp ms
  pausedAt: number | null; // timestamp ms
  accumulatedBeforePause: number; // seconds accumulated before current pause/resume
}
