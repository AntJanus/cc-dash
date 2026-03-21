"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ProjectBoardCard } from "./project-board-card";
import type { ProjectCardData } from "@/lib/projects/get-projects";

interface ProjectColumnProps {
  label: string;
  color: string;
  items: ProjectCardData[];
  defaultCollapsed?: boolean;
}

export function ProjectColumn({
  label,
  color,
  items,
  defaultCollapsed = false,
}: ProjectColumnProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-base font-semibold">{label}</h3>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {items.length}
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="flex max-h-[calc(100vh-280px)] flex-col gap-2 overflow-y-auto">
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No projects
            </p>
          ) : (
            items.map((project) => (
              <ProjectBoardCard key={project.slug} project={project} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
