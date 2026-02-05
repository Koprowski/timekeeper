"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDuration } from "@/lib/timer";
import TimeEntryForm from "@/components/TimeEntryForm";

interface EntryWithProjects {
  id: string;
  projectIds: string[];
  projectNames: string[];
  projectColors: (string | null)[];
  duration: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  referenceLinks: string[];
  tags: string[];
  source: "timer" | "manual";
  createdAt: string;
  updatedAt: string;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<EntryWithProjects[]>([]);
  const [editingEntry, setEditingEntry] = useState<EntryWithProjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const fetchEntries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterProject) params.set("projectId", filterProject);
    fetch(`/api/entries?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterProject]);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    fetchEntries();
  };

  // Summary stats
  const today = new Date().toISOString().split("T")[0];
  const todaySeconds = entries
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.duration, 0);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekSeconds = entries
    .filter((e) => e.date >= weekStartStr)
    .reduce((sum, e) => sum + e.duration, 0);

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthSeconds = entries
    .filter((e) => e.date >= monthStart)
    .reduce((sum, e) => sum + e.duration, 0);

  if (editingEntry) {
    return (
      <div className="mx-auto max-w-lg">
        <TimeEntryForm
          initialDuration={editingEntry.duration}
          source={editingEntry.source}
          existingEntry={{
            id: editingEntry.id,
            projectIds: editingEntry.projectIds,
            duration: editingEntry.duration,
            date: editingEntry.date,
            startTime: editingEntry.startTime,
            endTime: editingEntry.endTime,
            notes: editingEntry.notes,
            referenceLinks: editingEntry.referenceLinks,
            tags: editingEntry.tags,
            source: editingEntry.source,
            createdAt: new Date(editingEntry.createdAt),
            updatedAt: new Date(editingEntry.updatedAt),
          }}
          onClose={() => setEditingEntry(null)}
          onSaved={fetchEntries}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Entry History</h2>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Today</p>
          <p className="text-lg font-semibold font-mono">{formatDuration(todaySeconds)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">This Week</p>
          <p className="text-lg font-semibold font-mono">{formatDuration(weekSeconds)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">This Month</p>
          <p className="text-lg font-semibold font-mono">{formatDuration(monthSeconds)}</p>
        </div>
      </div>

      {/* Entries list */}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-zinc-500">No entries yet. Start tracking time!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {entry.projectNames.map((name, i) => (
                    <span
                      key={i}
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: entry.projectColors[i] ?? "#6B7280" }}
                    >
                      {name}
                    </span>
                  ))}
                  <span className="text-xs text-zinc-400">{entry.date}</span>
                  <span className="text-xs text-zinc-400 capitalize">({entry.source})</span>
                </div>
                {entry.notes && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{entry.notes}</p>
                )}
                {entry.referenceLinks.length > 0 && (
                  <div className="flex gap-2">
                    {entry.referenceLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate max-w-[200px]"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                )}
                {entry.tags.length > 0 && (
                  <div className="flex gap-1">
                    {entry.tags.map((tag, i) => (
                      <span key={i} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm">{formatDuration(entry.duration)}</span>
                <button
                  onClick={() => setEditingEntry(entry)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
