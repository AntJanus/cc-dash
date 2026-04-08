"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ProjectBoard } from "./project-board";
import { ProjectList } from "./project-list";
import { ProjectCard } from "./project-card";
import { ProjectSort } from "./project-sort";
import { HomeSearchInput } from "./home-search-input";
import { CrossProjectPromptButton } from "@/components/prompt/cross-project-prompt-button";
import { cn } from "@/lib/utils";
import { sortProjects } from "@/lib/projects/sort-projects";
import type { SortState } from "@/lib/projects/sort-projects";
import type { ProjectCardData } from "@/lib/projects/get-projects";

type ViewMode = "grid" | "list" | "board";
type StatusFilter = "all" | "active" | "stalled" | "complete";

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
  stalled: "Stalled",
  complete: "Complete",
};

interface ProjectHomeProps {
  projects: ProjectCardData[];
}

export function ProjectHome({ projects }: ProjectHomeProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Read sort from URL params
  const sortFieldParam = searchParams.get("sort");
  const sortDirParam = searchParams.get("dir");
  const sort: SortState = {
    field:
      sortFieldParam === "name" ||
      sortFieldParam === "progress" ||
      sortFieldParam === "last_updated" ||
      sortFieldParam === "status" ||
      sortFieldParam === "priority"
        ? sortFieldParam
        : "last_updated",
    direction:
      sortDirParam === "asc" || sortDirParam === "desc" ? sortDirParam : "desc",
  };

  function setSort(next: SortState) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.field === "last_updated" && next.direction === "desc") {
      params.delete("sort");
      params.delete("dir");
    } else {
      params.set("sort", next.field);
      params.set("dir", next.direction);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  }

  // Read status filter from URL
  const statusParam = searchParams.get("status");
  const statusFilter: StatusFilter =
    statusParam === "active" ||
    statusParam === "stalled" ||
    statusParam === "complete"
      ? statusParam
      : "all";

  // Filter projects by status first
  const statusFilteredProjects =
    statusFilter === "all"
      ? projects
      : projects.filter((p) => p.status === statusFilter);

  // Then filter by search query
  const searchFilteredProjects = searchQuery.trim()
    ? statusFilteredProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : statusFilteredProjects;

  // Finally apply sort
  const filteredProjects = sortProjects(searchFilteredProjects, sort);

  function clearStatusFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <>
      {/* Header with title and controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Projects
          </h1>
          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={clearStatusFilter}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{
                background: "var(--accent-teal-light)",
                color: "var(--accent-teal)",
              }}
            >
              {STATUS_FILTER_LABELS[statusFilter]}
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Sort controls */}
          <ProjectSort sort={sort} onChange={setSort} />
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
        <ProjectList projects={filteredProjects} searchQuery={searchQuery} />
      )}

      {viewMode === "board" && (
        <ProjectBoard projects={filteredProjects} searchQuery={searchQuery} />
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
