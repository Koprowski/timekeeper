"use client";

import { useState, useEffect } from "react";

interface ProjectWithTime {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  archived: boolean;
  totalSeconds: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithTime[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6B7280");
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    const [projectsRes, entriesRes] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/entries"),
    ]);
    const projectsData = await projectsRes.json();
    const entriesData = await entriesRes.json();

    // Calculate total time per project
    const timeByProject: Record<string, number> = {};
    for (const entry of entriesData) {
      for (const pid of entry.projectIds) {
        timeByProject[pid] = (timeByProject[pid] ?? 0) + entry.duration;
      }
    }

    setProjects(
      projectsData.map((p: ProjectWithTime) => ({
        ...p,
        totalSeconds: timeByProject[p.id] ?? 0,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setNewName("");
    fetchProjects();
  };

  const formatHours = (seconds: number) => {
    const h = (seconds / 3600).toFixed(1);
    return `${h}h`;
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading projects...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Projects</h2>

      <form onSubmit={handleCreate} className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">New Project</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Project name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Color</label>
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`flex items-center justify-between rounded-lg border p-4 ${
              project.archived
                ? "border-zinc-100 opacity-50 dark:border-zinc-900"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: project.color ?? "#6B7280" }}
              />
              <span className="font-medium">{project.name}</span>
              {project.archived && (
                <span className="text-xs text-zinc-400">(archived)</span>
              )}
            </div>
            <span className="font-mono text-sm text-zinc-500">
              {formatHours(project.totalSeconds)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
