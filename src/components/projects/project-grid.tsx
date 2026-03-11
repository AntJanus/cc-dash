"use client";

import { useState, useMemo } from "react";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";
import type { ProjectCardData } from "@/lib/projects/get-projects";

interface ProjectGridProps {
  projects: ProjectCardData[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Status filter
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }

      // Search filter (case-insensitive, matches name or description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(query);
        const matchesDescription = project.description
          .toLowerCase()
          .includes(query);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  if (projects.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>
          No projects found. Configure scan directories in
          ~/.config/cc-dash/config.json
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {filteredProjects.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
