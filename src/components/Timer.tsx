"use client";

import { useReducer, useEffect, useCallback } from "react";
import { timerReducer, initialTimerState, formatDuration } from "@/lib/timer";

interface TimerProps {
  onComplete: (durationSeconds: number) => void;
  onManualEntry?: () => void;
}

export default function Timer({ onComplete, onManualEntry }: TimerProps) {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleStartStop();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePauseResume();
      } else if ((e.key === "n" || e.key === "N") && onManualEntry) {
        e.preventDefault();
        onManualEntry();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleStartStop, handlePauseResume, onManualEntry]);

  const isActive = state.status === "running" || state.status === "paused";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="font-mono text-5xl sm:text-6xl font-light tabular-nums tracking-tight">
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

      {/* Keyboard shortcut hints */}
      <div className="flex gap-4 text-xs text-zinc-400">
        <span>
          <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-700">S</kbd>{" "}
          {isActive ? "Stop" : "Start"}
        </span>
        {isActive && (
          <span>
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-700">P</kbd>{" "}
            {state.status === "paused" ? "Resume" : "Pause"}
          </span>
        )}
        {!isActive && (
          <span>
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-700">N</kbd>{" "}
            Manual entry
          </span>
        )}
      </div>
    </div>
  );
}
