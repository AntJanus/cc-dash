"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SortField,
  SortDirection,
  SortState,
} from "@/lib/projects/sort-projects";

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "last_updated", label: "Updated" },
  { field: "priority", label: "Priority" },
  { field: "name", label: "Name" },
  { field: "progress", label: "Progress" },
  { field: "status", label: "Status" },
];

interface ProjectSortProps {
  sort: SortState;
  onChange: (sort: SortState) => void;
}

export function ProjectSort({ sort, onChange }: ProjectSortProps) {
  function handleFieldClick(field: SortField) {
    if (sort.field === field) {
      // Toggle direction when clicking the active field
      onChange({
        field,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // Switch to new field with a sensible default direction
      const defaultDirection = getDefaultDirection(field);
      onChange({ field, direction: defaultDirection });
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        Sort:
      </span>
      {SORT_OPTIONS.map((option) => {
        const isActive = sort.field === option.field;
        return (
          <button
            key={option.field}
            type="button"
            onClick={() => handleFieldClick(option.field)}
            className={cn(
              "interactive-btn inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              isActive ? "text-white" : "hover:text-[var(--text-secondary)]",
            )}
            style={{
              background: isActive ? "var(--accent-teal)" : "var(--bg-panel)",
              color: isActive ? undefined : "var(--text-muted)",
              border: `1px solid ${isActive ? "var(--accent-teal)" : "var(--border)"}`,
              boxShadow: isActive
                ? "0 0 12px var(--accent-teal-light)"
                : undefined,
            }}
            aria-pressed={isActive}
            aria-label={`Sort by ${option.label}${isActive ? `, ${sort.direction === "asc" ? "ascending" : "descending"}` : ""}`}
          >
            {option.label}
            {isActive ? (
              sort.direction === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Default sort direction for each field (most useful first). */
function getDefaultDirection(field: SortField): SortDirection {
  switch (field) {
    case "last_updated":
      return "desc"; // newest first
    case "progress":
      return "desc"; // highest progress first
    case "name":
      return "asc"; // A-Z
    case "status":
      return "asc"; // active first
    case "priority":
      return "asc"; // highest priority (lowest order) first
  }
}
