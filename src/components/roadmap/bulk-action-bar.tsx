"use client";

import { useState } from "react";
import { X, Trash2, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoadmapCategory } from "@/lib/schemas/roadmap";

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "idea", label: "Idea" },
] as const;

interface BulkActionBarProps {
  selectedCount: number;
  categories: RoadmapCategory[];
  onChangeStatus: (status: string) => Promise<void>;
  onMoveToCategory: (targetCategorySlug: string) => Promise<void>;
  onDelete: () => void;
  onClearSelection: () => void;
}

/**
 * Fixed-bottom floating action bar that appears when roadmap items are selected.
 * Provides bulk status change, category move, and delete actions.
 */
export function BulkActionBar({
  selectedCount,
  categories,
  onChangeStatus,
  onMoveToCategory,
  onDelete,
  onClearSelection,
}: BulkActionBarProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (selectedCount === 0) return null;

  async function handleStatusChange(status: string) {
    setStatusMenuOpen(false);
    setIsPending(true);
    try {
      await onChangeStatus(status);
    } finally {
      setIsPending(false);
    }
  }

  async function handleMoveToCategory(slug: string) {
    setCategoryMenuOpen(false);
    setIsPending(true);
    try {
      await onMoveToCategory(slug);
    } finally {
      setIsPending(false);
    }
  }

  function handleClickOutside() {
    setStatusMenuOpen(false);
    setCategoryMenuOpen(false);
  }

  return (
    <>
      {/* Backdrop to close open menus on outside click */}
      {(statusMenuOpen || categoryMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClickOutside}
          aria-hidden="true"
        />
      )}

      {/* Floating action bar */}
      <div
        data-testid="bulk-action-bar"
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        role="toolbar"
        aria-label="Bulk actions"
      >
        <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-lg ring-1 ring-foreground/10">
          {/* Selection count */}
          <span className="text-sm font-medium text-foreground">
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </span>

          <div className="h-5 w-px bg-border" aria-hidden="true" />

          {/* Change Status dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusMenuOpen((prev) => !prev);
                setCategoryMenuOpen(false);
              }}
              disabled={isPending}
              aria-haspopup="true"
              aria-expanded={statusMenuOpen}
            >
              Change Status
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {statusMenuOpen && (
              <div
                role="menu"
                className="absolute bottom-full left-0 z-50 mb-1 min-w-36 rounded-lg border bg-popover p-1 shadow-md"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    role="menuitem"
                    type="button"
                    className="flex w-full items-center rounded-md px-2.5 py-1.5 text-sm hover:bg-accent"
                    onClick={() => handleStatusChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Move to Category dropdown (only shown when 2+ categories exist) */}
          {categories.length > 1 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategoryMenuOpen((prev) => !prev);
                  setStatusMenuOpen(false);
                }}
                disabled={isPending}
                aria-haspopup="true"
                aria-expanded={categoryMenuOpen}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Move to Category
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              {categoryMenuOpen && (
                <div
                  role="menu"
                  className="absolute bottom-full left-0 z-50 mb-1 min-w-48 rounded-lg border bg-popover p-1 shadow-md"
                >
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      role="menuitem"
                      type="button"
                      className="flex w-full items-center rounded-md px-2.5 py-1.5 text-sm hover:bg-accent"
                      onClick={() => handleMoveToCategory(cat.slug)}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delete button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isPending}
            aria-label={`Delete ${selectedCount} selected ${selectedCount === 1 ? "item" : "items"}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>

          <div className="h-5 w-px bg-border" aria-hidden="true" />

          {/* Dismiss / clear selection */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClearSelection}
            disabled={isPending}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
