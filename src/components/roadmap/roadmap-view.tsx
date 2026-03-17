"use client";

import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RoadmapBoard } from "./roadmap-board";
import { RoadmapList } from "./roadmap-list";
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

interface RoadmapViewProps {
  roadmap: RoadmapFile;
  sessionRefs: Record<string, string>;
  slug?: string;
}

/**
 * Client Component that manages the board/list view toggle.
 * When slug is provided, manages local state for optimistic CRUD updates.
 * Computes a flat itemNames lookup for DependencyBadge tooltips.
 */
export function RoadmapView({ roadmap, sessionRefs, slug }: RoadmapViewProps) {
  const [categories, setCategories] = useState<RoadmapCategory[]>(
    roadmap.categories,
  );

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

  return (
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
          onAddItem={slug ? handleAddItem : undefined}
          onUpdateItem={slug ? handleUpdateItem : undefined}
          onDeleteItem={slug ? handleDeleteItem : undefined}
          onReorderItems={slug ? handleReorderItems : undefined}
          onAddCategory={slug ? handleAddCategory : undefined}
          onDeleteCategory={slug ? handleDeleteCategory : undefined}
        />
      </TabsContent>
    </Tabs>
  );
}
