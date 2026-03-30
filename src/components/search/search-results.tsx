"use client";

import { SearchResultCard } from "./search-result-card";
import type { SearchResults } from "@/lib/actions/search-actions";

interface SearchResultsProps {
  results: SearchResults;
  query: string;
}

const SECTION_CONFIG = [
  {
    key: "roadmapItems" as const,
    label: "Roadmap Items",
  },
  {
    key: "sessionTasks" as const,
    label: "Session Tasks",
  },
  {
    key: "ideas" as const,
    label: "Ideas",
  },
];

export function SearchResultsView({ results, query }: SearchResultsProps) {
  const totalCount =
    results.roadmapItems.length +
    results.sessionTasks.length +
    results.ideas.length;

  if (totalCount === 0) {
    return (
      <div
        data-testid="search-empty-state"
        className="py-16 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        <p className="text-base">No results found for &ldquo;{query}&rdquo;</p>
        <p className="mt-2 text-sm">
          Try different keywords or check the spelling.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="search-results" className="space-y-8">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {totalCount} result{totalCount !== 1 ? "s" : ""} for &ldquo;{query}
        &rdquo;
      </p>

      {SECTION_CONFIG.map(({ key, label }) => {
        const items = results[key];
        if (items.length === 0) return null;

        return (
          <section key={key} data-testid={`search-section-${key}`}>
            <h2
              className="mb-3 text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {label}
              <span
                className="ml-2 text-sm font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                ({items.length})
              </span>
            </h2>
            <div className="space-y-3">
              {items.map((result) => (
                <SearchResultCard key={result.itemId} result={result} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
