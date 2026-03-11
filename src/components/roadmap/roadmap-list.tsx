"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoadmapStatusBadge } from "@/components/shared/roadmap-status-badge";
import { DependencyBadge } from "@/components/shared/dependency-badge";
import type { RoadmapCategory } from "@/lib/schemas/roadmap";

export interface RoadmapListProps {
  categories: RoadmapCategory[];
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
}

export function RoadmapList({
  categories,
  sessionRefs,
  itemNames,
}: RoadmapListProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const visibleCategories =
    selectedCategory === "all"
      ? categories
      : categories.filter((cat) => cat.slug === selectedCategory);

  const totalItems = visibleCategories.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  return (
    <div data-testid="roadmap-list" className="space-y-6">
      <div className="flex items-center gap-2">
        <label htmlFor="category-filter" className="text-sm font-medium">
          Category:
        </label>
        <select
          id="category-filter"
          data-testid="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">All</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.title}
            </option>
          ))}
        </select>
      </div>

      {totalItems === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No roadmap items
        </div>
      )}

      {visibleCategories.map((category) => (
        <section key={category.slug}>
          <h3 className="mb-2 text-lg font-semibold">{category.title}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Dependencies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <RoadmapStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>{item.started ?? "\u2014"}</TableCell>
                  <TableCell>
                    <DependencyBadge
                      depends={item.depends ?? []}
                      itemNames={itemNames}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ))}
    </div>
  );
}
