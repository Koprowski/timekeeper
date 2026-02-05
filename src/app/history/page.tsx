"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDuration } from "@/lib/timer";
import TimeEntryForm from "@/components/TimeEntryForm";
import { useToast } from "@/components/Toast";

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
  const { toast } = useToast();

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
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Entry deleted");
      fetchEntries();
    } else {
      toast("Failed to delete entry", "error");
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Project(s)", "Duration (min)", "Duration (hrs)", "Notes", "Tags", "Source", "Reference Links"];
    const rows = entries.map((e) => [
      e.date,
      e.projectNames.join("; "),
      Math.round(e.duration / 60).toString(),
      (Math.round((e.duration / 3600) * 100) / 100).toString(),
      (e.notes ?? "").replace(/"/g, '""'),
      e.tags.join("; "),
      e.source,
      e.referenceLinks.join("; "),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timekeeper-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Entry History</h2>
        <div className="flex items-center gap-2">
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
          {entries.length > 0 && (
            <button
              onClick={exportCSV}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-lg border border-zinc-200 p-3 sm:p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Today</p>
          <p className="text-base sm:text-lg font-semibold font-mono">{formatDuration(todaySeconds)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3 sm:p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">This Week</p>
          <p className="text-base sm:text-lg font-semibold font-mono">{formatDuration(weekSeconds)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3 sm:p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">This Month</p>
          <p className="text-base sm:text-lg font-semibold font-mono">{formatDuration(monthSeconds)}</p>
        </div>
      </div>

      {/* Entries list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No entries yet. Start tracking time!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 dark:border-zinc-800"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{entry.notes}</p>
                )}
                {entry.referenceLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag, i) => (
                      <span key={i} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <span className="font-mono text-sm">{formatDuration(entry.duration)}</span>
                <button
                  onClick={() => setEditingEntry(entry)}
                  className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
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
