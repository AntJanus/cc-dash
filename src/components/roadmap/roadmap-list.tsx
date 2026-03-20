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
import type { RoadmapCategory } from "@/lib/schemas/roadmap";

export interface RoadmapListProps {
  categories: RoadmapCategory[];
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
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
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onAddCategory,
  onDeleteCategory,
}: RoadmapListProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addingItemForCategory, setAddingItemForCategory] = useState<
    string | null
  >(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const visibleCategories =
    selectedCategory === "all"
      ? categories
      : categories.filter((cat) => cat.slug === selectedCategory);

  const totalItems = visibleCategories.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  const hasCrud = Boolean(onAddItem);

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
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Dependencies</TableHead>
                {hasCrud && <TableHead>Move</TableHead>}
                {hasCrud && <TableHead>Order</TableHead>}
                {hasCrud && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.items.map((item, idx) => (
                <TableRow key={item.id}>
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
                  {hasCrud && (
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
