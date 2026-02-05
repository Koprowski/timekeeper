"use client";

import { useState } from "react";
import Timer from "@/components/Timer";
import TimeEntryForm from "@/components/TimeEntryForm";

export default function Home() {
  const [completedDuration, setCompletedDuration] = useState<number | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const handleTimerComplete = (durationSeconds: number) => {
    setCompletedDuration(durationSeconds);
    setShowManualEntry(false);
  };

  const handleManualEntry = () => {
    setCompletedDuration(null);
    setShowManualEntry(true);
  };

  const handleFormClose = () => {
    setCompletedDuration(null);
    setShowManualEntry(false);
  };

  const showForm = completedDuration !== null || showManualEntry;

  return (
    <div className="flex flex-col items-center gap-8">
      {!showForm && (
        <>
          <div className="pt-12">
            <Timer onComplete={handleTimerComplete} />
          </div>
          <button
            onClick={handleManualEntry}
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            + Log Time Manually
          </button>
        </>
      )}

      {showForm && (
        <div className="w-full max-w-lg pt-4">
          <TimeEntryForm
            initialDuration={completedDuration}
            source={completedDuration !== null ? "timer" : "manual"}
            onClose={handleFormClose}
          />
        </div>
      )}
    </div>
  );
}
