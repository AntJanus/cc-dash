"use client";

import { useState } from "react";
import { ProjectBoard } from "./project-board";
import { ProjectList } from "./project-list";
import { ProjectCard } from "./project-card";
import { HomeSearchInput } from "./home-search-input";
import { CrossProjectPromptButton } from "@/components/prompt/cross-project-prompt-button";
import { cn } from "@/lib/utils";
import type { ProjectCardData } from "@/lib/projects/get-projects";

type ViewMode = "grid" | "list" | "board";

interface ProjectHomeProps {
  projects: ProjectCardData[];
}

export function ProjectHome({ projects }: ProjectHomeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filter projects for grid view
  const filteredProjects = searchQuery.trim()
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : projects;

  return (
    <>
      {/* Header with title and controls */}
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Projects
        </h1>
        <div className="flex items-center gap-3">
          {/* View mode tabs */}
          <ViewTabs value={viewMode} onChange={setViewMode} />
          <HomeSearchInput value={searchQuery} onChange={setSearchQuery} />
          <CrossProjectPromptButton />
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.length === 0 ? (
            <div
              className="col-span-full py-12 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <p>No projects found</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))
          )}
        </div>
      )}

      {viewMode === "list" && (
        <ProjectList projects={projects} searchQuery={searchQuery} />
      )}

      {viewMode === "board" && (
        <ProjectBoard projects={projects} searchQuery={searchQuery} />
      )}
    </>
  );
}

interface ViewTabsProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function ViewTabs({ value, onChange }: ViewTabsProps) {
  const tabs: { mode: ViewMode; label: string }[] = [
    { mode: "grid", label: "Grid" },
    { mode: "list", label: "List" },
    { mode: "board", label: "Board" },
  ];

  return (
    <div
      className="flex gap-1 rounded-lg border p-1"
      style={{
        background: "var(--bg-panel)",
        borderColor: "var(--border)",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.mode}
          type="button"
          onClick={() => onChange(tab.mode)}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition-all",
            value === tab.mode
              ? "text-white dark:text-[var(--bg-space)]"
              : "hover:text-[var(--text-secondary)]",
          )}
          style={{
            background:
              value === tab.mode ? "var(--accent-teal)" : "transparent",
            color: value === tab.mode ? undefined : "var(--text-muted)",
            boxShadow:
              value === tab.mode
                ? "0 0 15px var(--accent-teal-light)"
                : undefined,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
