"use client";

import { useState, useMemo } from "react";
import { IdeaCard } from "@/components/ideas/idea-card";
import { IdeaFilters } from "@/components/ideas/idea-filters";
import type { IdeaItem } from "@/lib/schemas/ideas";

interface IdeasGridProps {
  ideas: IdeaItem[];
}

export function IdeasGrid({ ideas }: IdeasGridProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      // Status filter
      if (statusFilter !== "all" && idea.status !== statusFilter) {
        return false;
      }

      // Search filter (case-insensitive, matches title or body)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = idea.title.toLowerCase().includes(query);
        const matchesBody = idea.body.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBody) {
          return false;
        }
      }

      return true;
    });
  }, [ideas, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <IdeaFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {filteredIdeas.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No ideas found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
