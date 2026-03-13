"use client";

import { useState } from "react";

interface CategoryOption {
  title: string;
  slug: string;
}

interface MoveCategorySelectProps {
  categories: CategoryOption[];
  currentCategorySlug: string;
  onMove: (targetSlug: string) => void;
}

export function MoveCategorySelect({
  categories,
  currentCategorySlug,
  onMove,
}: MoveCategorySelectProps) {
  const [value, setValue] = useState("");

  const filteredCategories = categories.filter(
    (c) => c.slug !== currentCategorySlug,
  );

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = e.target.value;
    if (selected) {
      onMove(selected);
      setValue("");
    }
  }

  return (
    <select
      role="combobox"
      value={value}
      onChange={handleChange}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <option value="">Move to...</option>
      {filteredCategories.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.title}
        </option>
      ))}
    </select>
  );
}
