"use client";

import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RoadmapBoard } from "./roadmap-board";
import { RoadmapList } from "./roadmap-list";
import { BulkActionBar } from "./bulk-action-bar";
import type {
  RoadmapFile,
  RoadmapCategory,
  RoadmapItem,
} from "@/lib/schemas/roadmap";
import {
  addRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  reorderRoadmapItems,
  addRoadmapCategory,
  deleteRoadmapCategory,
} from "@/lib/actions/roadmap-actions";
import {
  bulkUpdateStatus,
  bulkMoveToCategory,
  bulkDeleteItems,
} from "@/lib/actions/bulk-roadmap-actions";

interface RoadmapViewProps {
  roadmap: RoadmapFile;
  sessionRefs: Record<string, string>;
  slug?: string;
}

/**
 * Client Component that manages the board/list view toggle.
 * When slug is provided, manages local state for optimistic CRUD updates.
 * Computes a flat itemNames lookup for DependencyBadge tooltips.
 * Also manages multi-select state for bulk operations.
 */
export function RoadmapView({ roadmap, sessionRefs, slug }: RoadmapViewProps) {
  const [categories, setCategories] = useState<RoadmapCategory[]>(
    roadmap.categories,
  );

  // --- Selection state ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds((prev) => {
      // Collect all visible item IDs
      const allIds = new Set(prev);
      // We add all item IDs from current categories
      for (const cat of categories) {
        for (const item of cat.items) {
          allIds.add(item.id);
        }
      }
      return allIds;
    });
  }, [categories]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Build flat item ID -> name lookup across all categories
  const itemNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const category of categories) {
      for (const item of category.items) {
        names[item.id] = item.name;
      }
    }
    return names;
  }, [categories]);

  // --- Bulk handlers ---

  const handleBulkStatusChange = useCallback(
    async (status: string) => {
      if (!slug || selectedIds.size === 0) return;

      const ids = Array.from(selectedIds);
      const prev = categories;

      // Optimistic update
      setCategories((cats) =>
        cats.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            selectedIds.has(item.id)
              ? ({ ...item, status } as RoadmapItem)
              : item,
          ),
        })),
      );

      const result = await bulkUpdateStatus(slug, ids, status);
      if (!result.success) {
        setCategories(prev);
      } else {
        setSelectedIds(new Set());
      }
    },
    [slug, selectedIds, categories],
  );

  const handleBulkMoveToCategory = useCallback(
    async (targetCategorySlug: string) => {
      if (!slug || selectedIds.size === 0) return;

      const ids = Array.from(selectedIds);
      const prev = categories;

      // Optimistic update: move items to target category
      setCategories((cats) => {
        let newCats = cats.map((cat) => ({ ...cat, items: [...cat.items] }));
        const movedItems: RoadmapCategory["items"] = [];

        // Remove from source categories
        newCats = newCats.map((cat) => {
          if (cat.slug === targetCategorySlug) return cat;
          const remaining: RoadmapCategory["items"] = [];
          for (const item of cat.items) {
            if (selectedIds.has(item.id)) {
              movedItems.push(item);
            } else {
              remaining.push(item);
            }
          }
          return { ...cat, items: remaining };
        });

        // Add to target category
        newCats = newCats.map((cat) =>
          cat.slug === targetCategorySlug
            ? { ...cat, items: [...cat.items, ...movedItems] }
            : cat,
        );

        return newCats;
      });

      const result = await bulkMoveToCategory(slug, ids, targetCategorySlug);
      if (!result.success) {
        setCategories(prev);
      } else {
        setSelectedIds(new Set());
      }
    },
    [slug, selectedIds, categories],
  );

  const handleBulkDelete = useCallback(async () => {
    if (!slug || selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    const prev = categories;

    // Optimistic update: remove selected items
    setCategories((cats) =>
      cats.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => !selectedIds.has(item.id)),
      })),
    );
    setSelectedIds(new Set());
    setShowBulkDeleteDialog(false);

    const result = await bulkDeleteItems(slug, ids);
    if (!result.success) {
      setCategories(prev);
    }
  }, [slug, selectedIds, categories]);

  // --- Single-item CRUD handlers ---

  const handleAddItem = useCallback(
    async (
      categorySlug: string,
      input: { name: string; description: string; status: string },
    ) => {
      if (!slug) return;

      const tempId = `r_tmp${Date.now().toString(36).slice(-3)}${Math.random().toString(36).slice(2, 4)}`;
      const prev = categories;

      // Optimistic: add item with temp ID
      setCategories((cats) =>
        cats.map((cat) =>
          cat.slug === categorySlug
            ? {
                ...cat,
                items: [
                  ...cat.items,
                  {
                    id: tempId,
                    name: input.name,
                    description: input.description,
                    status: input.status as
                      | "planned"
                      | "in-progress"
                      | "done"
                      | "idea",
                  },
                ],
              }
            : cat,
        ),
      );

      const result = await addRoadmapItem(slug, categorySlug, input);
      if (result.success) {
        // Replace temp ID with real ID
        setCategories((cats) =>
          cats.map((cat) => ({
            ...cat,
            items: cat.items.map((item) =>
              item.id === tempId ? { ...item, id: result.data.id } : item,
            ),
          })),
        );
      } else {
        setCategories(prev);
      }
    },
    [slug, categories],
  );

  const handleUpdateItem = useCallback(
    async (
      itemId: string,
      updates: {
        name?: string;
        description?: string;
        status?: string;
        categorySlug?: string;
        depends?: string[];
      },
    ) => {
      if (!slug) return;

      const prev = categories;

      // Optimistic update
      setCategories((cats) => {
        let newCats = cats.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId
              ? ({ ...item, ...updates } as RoadmapItem)
              : item,
          ),
        }));

        // Handle cross-category move
        if (updates.categorySlug) {
          let movingItem: RoadmapCategory["items"][number] | undefined;
          // Remove from source
          newCats = newCats.map((cat) => {
            const found = cat.items.find((i) => i.id === itemId);
            if (found && cat.slug !== updates.categorySlug) {
              movingItem = found;
              return {
                ...cat,
                items: cat.items.filter((i) => i.id !== itemId),
              };
            }
            return cat;
          });
          // Add to target
          if (movingItem) {
            newCats = newCats.map((cat) =>
              cat.slug === updates.categorySlug
                ? { ...cat, items: [...cat.items, movingItem!] }
                : cat,
            );
          }
        }

        return newCats;
      });

      const result = await updateRoadmapItem(slug, itemId, updates);
      if (!result.success) {
        setCategories(prev);
      }
    },
    [slug, categories],
  );

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!slug) return;

      const prev = categories;

      // Optimistic: remove item
      setCategories((cats) =>
        cats.map((cat) => ({
          ...cat,
          items: cat.items.filter((i) => i.id !== itemId),
        })),
      );

      const result = await deleteRoadmapItem(slug, itemId);
      if (!result.success) {
        setCategories(prev);
      }
    },
    [slug, categories],
  );

  const handleReorderItems = useCallback(
    async (categorySlug: string, orderedItemIds: string[]) => {
      if (!slug) return;

      const prev = categories;

      // Optimistic: reorder items in category
      setCategories((cats) =>
        cats.map((cat) => {
          if (cat.slug !== categorySlug) return cat;
          const itemMap = new Map(cat.items.map((item) => [item.id, item]));
          const reordered = orderedItemIds
            .map((id) => itemMap.get(id))
            .filter(Boolean) as RoadmapCategory["items"];
          return { ...cat, items: reordered };
        }),
      );

      const result = await reorderRoadmapItems(
        slug,
        categorySlug,
        orderedItemIds,
      );
      if (!result.success) {
        setCategories(prev);
      }
    },
    [slug, categories],
  );

  const handleAddCategory = useCallback(
    async (title: string) => {
      if (!slug) return;

      const tempSlug = `tmp-${title.toLowerCase().replace(/\s+/g, "-")}`;
      const prev = categories;

      // Optimistic: add empty category
      setCategories((cats) => [...cats, { title, slug: tempSlug, items: [] }]);

      const result = await addRoadmapCategory(slug, title);
      if (result.success) {
        // Replace temp slug with real slug
        setCategories((cats) =>
          cats.map((cat) =>
            cat.slug === tempSlug ? { ...cat, slug: result.data.slug } : cat,
          ),
        );
      } else {
        setCategories(prev);
      }
    },
    [slug, categories],
  );

  const handleDragStatusChange = useCallback(
    async (itemId: string, newStatus: string) => {
      // Delegate to existing handleUpdateItem which handles optimistic UI + server action
      await handleUpdateItem(itemId, { status: newStatus });
    },
    [handleUpdateItem],
  );

  const handleDeleteCategory = useCallback(
    async (categorySlug: string) => {
      if (!slug) return;

      const prev = categories;

      // Optimistic: remove category
      setCategories((cats) => cats.filter((cat) => cat.slug !== categorySlug));

      const result = await deleteRoadmapCategory(slug, categorySlug);
      if (!result.success) {
        setCategories(prev);
      }
    },
    [slug, categories],
  );

  // Derive selected item name for bulk delete dialog
  const selectedCount = selectedIds.size;
  const bulkDeleteLabel =
    selectedCount === 1 ? "1 selected item" : `${selectedCount} selected items`;

  return (
    <>
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <RoadmapBoard
            categories={categories}
            sessionRefs={sessionRefs}
            itemNames={itemNames}
            selectedIds={selectedIds}
            onToggleSelect={slug ? toggleSelect : undefined}
            onDragStatusChange={slug ? handleDragStatusChange : undefined}
            onUpdateItem={slug ? handleUpdateItem : undefined}
            onDeleteItem={slug ? handleDeleteItem : undefined}
            onAddItem={slug ? handleAddItem : undefined}
          />
        </TabsContent>
        <TabsContent value="list">
          <RoadmapList
            categories={categories}
            sessionRefs={sessionRefs}
            itemNames={itemNames}
            selectedIds={selectedIds}
            onToggleSelect={slug ? toggleSelect : undefined}
            onSelectAll={slug ? selectAll : undefined}
            onClearSelection={slug ? clearSelection : undefined}
            onAddItem={slug ? handleAddItem : undefined}
            onUpdateItem={slug ? handleUpdateItem : undefined}
            onDeleteItem={slug ? handleDeleteItem : undefined}
            onReorderItems={slug ? handleReorderItems : undefined}
            onAddCategory={slug ? handleAddCategory : undefined}
            onDeleteCategory={slug ? handleDeleteCategory : undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Bulk action bar — shown when items are selected and slug is available */}
      {slug && selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          categories={categories}
          onChangeStatus={handleBulkStatusChange}
          onMoveToCategory={handleBulkMoveToCategory}
          onDelete={() => setShowBulkDeleteDialog(true)}
          onClearSelection={clearSelection}
        />
      )}

      {/* Bulk delete confirmation dialog */}
      {showBulkDeleteDialog && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="fixed inset-0 bg-black/10"
            onClick={() => setShowBulkDeleteDialog(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-background p-4 ring-1 ring-foreground/10 shadow-lg">
            <h2 className="text-base font-medium">Delete {bulkDeleteLabel}?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This will permanently remove the selected items from the roadmap
              file. This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="interactive-btn inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium"
                onClick={() => setShowBulkDeleteDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="interactive-btn inline-flex h-8 items-center justify-center rounded-lg bg-destructive/10 px-2.5 text-sm font-medium text-destructive hover:bg-destructive/20"
                onClick={handleBulkDelete}
              >
                Delete {selectedCount} {selectedCount === 1 ? "item" : "items"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
