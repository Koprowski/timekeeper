import { TimerState } from "@/types";

export const initialTimerState: TimerState = {
  status: "idle",
  elapsed: 0,
  startedAt: null,
  pausedAt: null,
  accumulatedBeforePause: 0,
};

export type TimerAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "TICK" }
  | { type: "RESET" };

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "START": {
      return {
        status: "running",
        elapsed: 0,
        startedAt: Date.now(),
        pausedAt: null,
        accumulatedBeforePause: 0,
      };
    }
    case "PAUSE": {
      if (state.status !== "running" || !state.startedAt) return state;
      const now = Date.now();
      const elapsedSinceResume = (now - state.startedAt) / 1000;
      return {
        ...state,
        status: "paused",
        pausedAt: now,
        accumulatedBeforePause: state.accumulatedBeforePause + elapsedSinceResume,
        elapsed: state.accumulatedBeforePause + elapsedSinceResume,
      };
    }
    case "RESUME": {
      if (state.status !== "paused") return state;
      return {
        ...state,
        status: "running",
        startedAt: Date.now(),
        pausedAt: null,
      };
    }
    case "STOP": {
      return {
        ...initialTimerState,
        elapsed: state.elapsed,
      };
    }
    case "TICK": {
      if (state.status !== "running" || !state.startedAt) return state;
      const elapsedSinceResume = (Date.now() - state.startedAt) / 1000;
      return {
        ...state,
        elapsed: state.accumulatedBeforePause + elapsedSinceResume,
      };
    }
    case "RESET": {
      return initialTimerState;
    }
    default:
      return state;
  }
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}
