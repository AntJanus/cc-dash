"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { PROJECT_TEMPLATES } from "@/lib/templates/project-templates";
import type { CreateProjectData } from "./create-project-types";

interface StepTemplateProps {
  data: CreateProjectData;
  onChange: (updates: Partial<CreateProjectData>) => void;
}

/**
 * Step 2: Template selection, category editing, starter item editing.
 */
export function CreateProjectStepTemplate({
  data,
  onChange,
}: StepTemplateProps) {
  const [newCategory, setNewCategory] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemCat, setNewItemCat] = useState("");

  function selectTemplate(templateId: string) {
    const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    onChange({
      templateId,
      categories: [...template.categories],
      starterItems: [...template.starterItems],
      stack:
        template.defaultStack.length > 0 && data.stack.length === 0
          ? [...template.defaultStack]
          : data.stack,
    });
  }

  function addCategory() {
    const title = newCategory.trim();
    if (!title) return;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    if (data.categories.some((c) => c.slug === slug)) return;

    onChange({
      categories: [...data.categories, { title, slug }],
    });
    setNewCategory("");
  }

  function removeCategory(slug: string) {
    onChange({
      categories: data.categories.filter((c) => c.slug !== slug),
      starterItems: data.starterItems.filter((i) => i.categorySlug !== slug),
    });
  }

  function addStarterItem() {
    const name = newItemName.trim();
    const desc = newItemDesc.trim();
    const cat = newItemCat || data.categories[0]?.slug;
    if (!name || !cat) return;

    onChange({
      starterItems: [
        ...data.starterItems,
        { name, description: desc, categorySlug: cat },
      ],
    });
    setNewItemName("");
    setNewItemDesc("");
  }

  function removeStarterItem(index: number) {
    onChange({
      starterItems: data.starterItems.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-6">
      {/* Template picker */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Template</h3>
        <div className="grid grid-cols-3 gap-2">
          {PROJECT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t.id)}
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                data.templateId === t.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="mt-1 text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Categories</h3>
        <div className="space-y-1">
          {data.categories.map((cat) => (
            <div
              key={cat.slug}
              className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm"
            >
              <span>{cat.title}</span>
              <button
                onClick={() => removeCategory(cat.slug)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${cat.title}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addCategory}
            disabled={!newCategory.trim()}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Starter items */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Starter Roadmap Items</h3>
        <div className="space-y-1">
          {data.starterItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm"
            >
              <span>
                <span className="font-medium">{item.name}</span>
                <span className="mx-1 text-muted-foreground">in</span>
                <span className="text-muted-foreground">
                  {data.categories.find((c) => c.slug === item.categorySlug)
                    ?.title ?? item.categorySlug}
                </span>
              </span>
              <button
                onClick={() => removeStarterItem(idx)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${item.name}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        {data.categories.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
              />
              <select
                value={newItemCat || data.categories[0]?.slug}
                onChange={(e) => setNewItemCat(e.target.value)}
                className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                {data.categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Input
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                placeholder="Description (optional)"
                onKeyDown={(e) => e.key === "Enter" && addStarterItem()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addStarterItem}
                disabled={!newItemName.trim()}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
