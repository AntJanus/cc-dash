"use client";

import type { ActivityEventType } from "@/lib/activity/types";

interface ActivityFiltersProps {
  projects: string[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const EVENT_TYPE_LABELS: Record<ActivityEventType | "all", string> = {
  all: "All Types",
  roadmap_item_completed: "Completed",
  roadmap_item_started: "Started",
  session_started: "Sessions",
  session_work_completed: "Work Done",
};

export function ActivityFilters({
  projects,
  selectedProject,
  onProjectChange,
  selectedType,
  onTypeChange,
}: ActivityFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        aria-label="Filter by project"
      >
        <option value="all">All Projects</option>
        {projects.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        aria-label="Filter by type"
      >
        {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
