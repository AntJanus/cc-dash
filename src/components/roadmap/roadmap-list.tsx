"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoadmapStatusBadge } from "@/components/shared/roadmap-status-badge";
import { DependencyBadge } from "@/components/shared/dependency-badge";
import { EditableText } from "./editable-text";
import { ClickableRoadmapStatusBadge } from "./clickable-roadmap-status-badge";
import { ReorderButtons } from "./reorder-buttons";
import { MoveCategorySelect } from "./move-category-select";
import { DeleteItemDialog } from "./delete-item-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { RoadmapItemForm } from "./roadmap-item-form";
import type { RoadmapCategory, RoadmapItem } from "@/lib/schemas/roadmap";

type SortOption = "manual" | "status" | "name" | "started";

const STATUS_ORDER: Record<string, number> = {
  idea: 0,
  planned: 1,
  "in-progress": 2,
  done: 3,
};

function sortItems(items: RoadmapItem[], sortBy: SortOption): RoadmapItem[] {
  if (sortBy === "manual") return items;

  return [...items].sort((a, b) => {
    switch (sortBy) {
      case "status":
        return (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
      case "name":
        return a.name.localeCompare(b.name);
      case "started": {
        // Items with no started date go to the end
        if (!a.started && !b.started) return 0;
        if (!a.started) return 1;
        if (!b.started) return -1;
        return a.started.localeCompare(b.started);
      }
      default:
        return 0;
    }
  });
}

export interface RoadmapListProps {
  categories: RoadmapCategory[];
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onAddItem?: (
    categorySlug: string,
    input: { name: string; description: string; status: string },
  ) => void;
  onUpdateItem?: (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      status?: string;
      categorySlug?: string;
    },
  ) => void;
  onDeleteItem?: (itemId: string) => void;
  onReorderItems?: (categorySlug: string, orderedItemIds: string[]) => void;
  onAddCategory?: (title: string) => void;
  onDeleteCategory?: (categorySlug: string) => void;
}

export function RoadmapList({
  categories,
  sessionRefs: _sessionRefs,
  itemNames,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onAddCategory,
  onDeleteCategory,
}: RoadmapListProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("manual");
  const [addingItemForCategory, setAddingItemForCategory] = useState<
    string | null
  >(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const filteredCategories =
    selectedCategory === "all"
      ? categories
      : categories.filter((cat) => cat.slug === selectedCategory);

  // Apply sorting to each category's items
  const visibleCategories = useMemo(() => {
    return filteredCategories.map((cat) => ({
      ...cat,
      items: sortItems(cat.items, sortBy),
    }));
  }, [filteredCategories, sortBy]);

  const totalItems = visibleCategories.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  const hasCrud = Boolean(onAddItem);
  const canReorder = sortBy === "manual";
  const hasBulk = Boolean(onToggleSelect);

  // Compute all visible item IDs for select-all state
  const allVisibleIds = useMemo(
    () => visibleCategories.flatMap((cat) => cat.items.map((i) => i.id)),
    [visibleCategories],
  );
  const allSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds?.has(id));
  const someSelected =
    !allSelected && allVisibleIds.some((id) => selectedIds?.has(id));

  function handleMoveItem(
    itemId: string,
    currentCategorySlug: string,
    targetCategorySlug: string,
  ) {
    if (!onUpdateItem) return;
    onUpdateItem(itemId, { categorySlug: targetCategorySlug });
  }

  function handleReorder(
    category: RoadmapCategory,
    itemIndex: number,
    direction: "up" | "down",
  ) {
    if (!onReorderItems) return;
    const ids = category.items.map((i) => i.id);
    const swapIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    [ids[itemIndex], ids[swapIndex]] = [ids[swapIndex], ids[itemIndex]];
    onReorderItems(category.slug, ids);
  }

  function handleAddCategory() {
    if (!onAddCategory || !newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim());
    setNewCategoryName("");
    setShowAddCategory(false);
  }

  return (
    <div data-testid="roadmap-list" className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        {hasBulk && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all-items"
              data-testid="select-all-checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={() => {
                if (allSelected) {
                  onClearSelection?.();
                } else {
                  onSelectAll?.();
                }
              }}
              aria-label="Select all items"
              className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
            />
            <label
              htmlFor="select-all-items"
              className="cursor-pointer text-sm font-medium"
            >
              Select all
            </label>
          </div>
        )}
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
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="text-sm font-medium">
            Sort:
          </label>
          <select
            id="sort-by"
            data-testid="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="manual">Manual</option>
            <option value="status">Status</option>
            <option value="name">Name (A-Z)</option>
            <option value="started">Started Date</option>
          </select>
        </div>
      </div>

      {totalItems === 0 && !hasCrud && (
        <div className="py-8 text-center text-muted-foreground">
          No roadmap items
        </div>
      )}

      {visibleCategories.map((category) => (
        <section key={category.slug}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-lg font-semibold">{category.title}</h3>
            {onDeleteCategory && categories.length > 1 && (
              <DeleteCategoryDialog
                categoryName={category.title}
                itemCount={category.items.length}
                onConfirm={() => onDeleteCategory(category.slug)}
              />
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {hasBulk && <TableHead className="w-10" />}
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Dependencies</TableHead>
                {hasCrud && <TableHead>Move</TableHead>}
                {hasCrud && canReorder && <TableHead>Order</TableHead>}
                {hasCrud && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.items.map((item, idx) => (
                <TableRow
                  key={item.id}
                  data-selected={selectedIds?.has(item.id) ? "true" : undefined}
                  className={
                    selectedIds?.has(item.id) ? "bg-primary/5" : undefined
                  }
                >
                  {hasBulk && (
                    <TableCell className="w-10">
                      <input
                        type="checkbox"
                        data-testid={`list-select-item-${item.id}`}
                        checked={selectedIds?.has(item.id) ?? false}
                        onChange={() => onToggleSelect?.(item.id)}
                        aria-label={`Select ${item.name}`}
                        className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {onUpdateItem ? (
                      <EditableText
                        value={item.name}
                        onSave={(v) => onUpdateItem(item.id, { name: v })}
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>
                    {onUpdateItem ? (
                      <ClickableRoadmapStatusBadge
                        status={item.status}
                        onStatusChange={(s) =>
                          onUpdateItem(item.id, { status: s })
                        }
                      />
                    ) : (
                      <RoadmapStatusBadge status={item.status} />
                    )}
                  </TableCell>
                  <TableCell>{item.started ?? "\u2014"}</TableCell>
                  <TableCell>
                    <DependencyBadge
                      depends={item.depends ?? []}
                      itemNames={itemNames}
                    />
                  </TableCell>
                  {hasCrud && (
                    <TableCell>
                      {categories.length > 1 && (
                        <MoveCategorySelect
                          categories={categories.map((c) => ({
                            title: c.title,
                            slug: c.slug,
                          }))}
                          currentCategorySlug={category.slug}
                          onMove={(target) =>
                            handleMoveItem(item.id, category.slug, target)
                          }
                        />
                      )}
                    </TableCell>
                  )}
                  {hasCrud && canReorder && (
                    <TableCell>
                      <ReorderButtons
                        onMoveUp={() => handleReorder(category, idx, "up")}
                        onMoveDown={() => handleReorder(category, idx, "down")}
                        isFirst={idx === 0}
                        isLast={idx === category.items.length - 1}
                      />
                    </TableCell>
                  )}
                  {hasCrud && (
                    <TableCell>
                      {onDeleteItem && (
                        <DeleteItemDialog
                          itemName={item.name}
                          onConfirm={() => onDeleteItem(item.id)}
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {onAddItem && (
            <div className="mt-2">
              {addingItemForCategory === category.slug ? (
                <RoadmapItemForm
                  onSubmit={(data) => {
                    onAddItem(category.slug, data);
                    setAddingItemForCategory(null);
                  }}
                  onCancel={() => setAddingItemForCategory(null)}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingItemForCategory(category.slug)}
                >
                  Add item
                </Button>
              )}
            </div>
          )}
        </section>
      ))}

      {onAddCategory && (
        <div className="mt-4">
          {showAddCategory ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                  if (e.key === "Escape") {
                    setShowAddCategory(false);
                    setNewCategoryName("");
                  }
                }}
              />
              <Button size="sm" onClick={handleAddCategory}>
                Create
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCategory(true)}
            >
              Add category
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
