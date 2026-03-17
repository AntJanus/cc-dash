"use client";

import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "not-started", label: "Not Started" },
  { value: "started", label: "Started" },
  { value: "complete", label: "Complete" },
] as const;

interface IdeaFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function IdeaFilters({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
}: IdeaFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Input
        placeholder="Search ideas..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:max-w-xs"
      />
    </div>
  );
}
