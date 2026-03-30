"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchResultsView } from "./search-results";
import { searchAllProjects } from "@/lib/actions/search-actions";
import type { SearchResults } from "@/lib/actions/search-actions";

const EMPTY_RESULTS: SearchResults = {
  roadmapItems: [],
  sessionTasks: [],
  ideas: [],
};

export function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Run search when query changes (with debounce via useEffect)
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults(EMPTY_RESULTS);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchAllProjects(trimmed);
        setResults(data);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    // Update URL param without re-rendering the server component
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex-1 overflow-auto p-8 lg:p-10">
      {/* Page heading */}
      <div className="mb-6">
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Search
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Search across all projects&rsquo; roadmap items, session tasks, and
          ideas.
        </p>
      </div>

      {/* Search input */}
      <div className="relative mb-8 max-w-xl">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search roadmap items, tasks, ideas..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-9"
          aria-label="Search query"
          autoFocus
        />
      </div>

      {/* Results area */}
      {isSearching && (
        <div
          data-testid="search-pending"
          className="py-8 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Searching...
        </div>
      )}

      {!isSearching && hasSearched && (
        <SearchResultsView results={results} query={query.trim()} />
      )}

      {!isSearching && !hasSearched && !query.trim() && (
        <div
          data-testid="search-prompt"
          className="py-16 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          <Search className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-base">Enter a search term to get started.</p>
        </div>
      )}
    </div>
  );
}
