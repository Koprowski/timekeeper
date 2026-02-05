"use client";

import { useReducer, useEffect, useCallback } from "react";
import { timerReducer, initialTimerState, formatDuration } from "@/lib/timer";

interface TimerProps {
  onComplete: (durationSeconds: number) => void;
}

export default function Timer({ onComplete }: TimerProps) {
  const [state, dispatch] = useReducer(timerReducer, initialTimerState);

  useEffect(() => {
    if (state.status !== "running") return;
    const interval = setInterval(() => dispatch({ type: "TICK" }), 100);
    return () => clearInterval(interval);
  }, [state.status]);

  const handleStartStop = useCallback(() => {
    if (state.status === "idle") {
      dispatch({ type: "START" });
    } else if (state.status === "running" || state.status === "paused") {
      dispatch({ type: "TICK" });
      onComplete(Math.round(state.elapsed));
      dispatch({ type: "RESET" });
    }
  }, [state.status, state.elapsed, onComplete]);

  const handlePauseResume = useCallback(() => {
    if (state.status === "running") {
      dispatch({ type: "PAUSE" });
    } else if (state.status === "paused") {
      dispatch({ type: "RESUME" });
    }
  }, [state.status]);

  const isActive = state.status === "running" || state.status === "paused";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="font-mono text-6xl font-light tabular-nums tracking-tight">
        {formatDuration(state.elapsed)}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleStartStop}
          className={`rounded-full px-8 py-3 text-sm font-medium transition-colors ${
            isActive
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          }`}
        >
          {isActive ? "Stop" : "Start"}
        </button>

        {isActive && (
          <button
            onClick={handlePauseResume}
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {state.status === "paused" ? "Resume" : "Pause"}
          </button>
        )}
      </div>

      {state.status === "paused" && (
        <p className="text-sm text-zinc-500">Paused</p>
      )}
    </div>
  );
}
