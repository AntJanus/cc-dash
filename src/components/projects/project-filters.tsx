"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "stalled", label: "Stalled" },
  { value: "complete", label: "Complete" },
  { value: "inactive", label: "Inactive" },
] as const;

interface ProjectFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProjectFilters({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={statusFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusFilterChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <Input
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:max-w-xs"
      />
    </div>
  );
}
