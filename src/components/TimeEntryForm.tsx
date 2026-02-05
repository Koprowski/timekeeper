"use client";

import { useState, useEffect } from "react";
import { Project, TimeEntry } from "@/types";
import { formatDuration } from "@/lib/timer";
import { useToast } from "@/components/Toast";

interface TimeEntryFormProps {
  initialDuration: number | null; // seconds, from timer
  source: "timer" | "manual";
  existingEntry?: TimeEntry; // for editing
  onClose: () => void;
  onSaved?: () => void;
}

export default function TimeEntryForm({
  initialDuration,
  source,
  existingEntry,
  onClose,
  onSaved,
}: TimeEntryFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    existingEntry?.projectIds ?? []
  );
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState(
    existingEntry?.date ?? new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(existingEntry?.notes ?? "");
  const [referenceLinks, setReferenceLinks] = useState<string[]>(
    existingEntry?.referenceLinks ?? [""]
  );
  const [tags, setTags] = useState(existingEntry?.tags?.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const dur = existingEntry
      ? existingEntry.duration
      : initialDuration ?? 0;
    setHours(Math.floor(dur / 3600).toString());
    setMinutes(Math.floor((dur % 3600) / 60).toString());
  }, [initialDuration, existingEntry]);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(console.error);
  }, []);

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const durationSeconds =
    (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;

  const addLinkField = () => setReferenceLinks([...referenceLinks, ""]);

  const updateLink = (index: number, value: string) => {
    const updated = [...referenceLinks];
    updated[index] = value;
    setReferenceLinks(updated);
  };

  const removeLink = (index: number) => {
    setReferenceLinks(referenceLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectIds.length === 0) return;
    if (durationSeconds <= 0) return;

    setSaving(true);

    const body = {
      projectIds: selectedProjectIds,
      duration: durationSeconds,
      date,
      notes: notes || null,
      referenceLinks: referenceLinks.filter((l) => l.trim() !== ""),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      source,
    };

    try {
      const url = existingEntry
        ? `/api/entries/${existingEntry.id}`
        : "/api/entries";
      const method = existingEntry ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast(existingEntry ? "Entry updated" : "Entry saved");
        onSaved?.();
        onClose();
      } else {
        toast("Failed to save entry", "error");
      }
    } catch {
      toast("Failed to save entry", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {existingEntry ? "Edit Entry" : source === "timer" ? "Save Timer Entry" : "Log Time"}
        </h2>
        {initialDuration !== null && !existingEntry && (
          <span className="font-mono text-sm text-zinc-500">
            {formatDuration(initialDuration)}
          </span>
        )}
      </div>

      {/* Project multi-select */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Project(s) <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {projects.filter((p) => !p.archived).map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => toggleProject(project.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedProjectIds.includes(project.id)
                  ? "text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
              style={
                selectedProjectIds.includes(project.id) && project.color
                  ? { backgroundColor: project.color }
                  : undefined
              }
            >
              {project.name}
            </button>
          ))}
        </div>
        {selectedProjectIds.length === 0 && (
          <p className="mt-1 text-xs text-red-500">Select at least one project</p>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Duration</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-20 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="0"
          />
          <span className="text-sm text-zinc-500">h</span>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-20 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="0"
          />
          <span className="text-sm text-zinc-500">m</span>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="What did you work on?"
        />
      </div>

      {/* Reference Links */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Reference Links</label>
        {referenceLinks.map((link, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              type="url"
              value={link}
              onChange={(e) => updateLink(i, e.target.value)}
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="https://..."
            />
            {referenceLinks.length > 1 && (
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="text-sm text-zinc-400 hover:text-red-500"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addLinkField}
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          + Add Link
        </button>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="meeting, design, review (comma-separated)"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || selectedProjectIds.length === 0 || durationSeconds <= 0}
          className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Saving..." : existingEntry ? "Update" : "Save Entry"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
