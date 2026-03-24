"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";
import { DependencyBadge } from "@/components/shared/dependency-badge";
import { ClickableRoadmapStatusBadge } from "./clickable-roadmap-status-badge";
import { ItemActionsMenu } from "./item-actions-menu";
import { EditableText } from "./editable-text";
import { DeleteItemDialog } from "./delete-item-dialog";
import { RoadmapDependencyPicker } from "./roadmap-dependency-picker";
import type { BoardItem } from "./roadmap-board";

interface RoadmapCardProps {
  item: BoardItem;
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
  allItems?: Array<{ id: string; name: string }>;
  onUpdateItem?: (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      status?: string;
      categorySlug?: string;
      depends?: string[];
    },
  ) => void;
  onDeleteItem?: (itemId: string) => void;
  enableDnd?: boolean;
}

/**
 * A Kanban board card for a roadmap item.
 * Shows name, description, category badge, dependencies, dates, and session link.
 * When CRUD callbacks are provided, shows action menu and clickable status badge.
 * When enableDnd is true, uses useSortable for drag behavior with a dedicated drag handle.
 */
export function RoadmapCard({
  item,
  sessionRefs,
  itemNames,
  allItems,
  onUpdateItem,
  onDeleteItem,
  enableDnd,
}: RoadmapCardProps) {
  const sessionUrl = sessionRefs[item.id];
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDepPicker, setShowDepPicker] = useState(false);
  const hasCrud = Boolean(onUpdateItem);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !enableDnd,
  });

  const style = enableDnd
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Card
      size="sm"
      ref={setNodeRef}
      style={style}
      className="interactive-card hover:ring-2 hover:ring-foreground/10"
      {...(enableDnd ? attributes : {})}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-1">
          {enableDnd && (
            <div
              data-testid="drag-handle"
              className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground"
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {editing && onUpdateItem ? (
              <EditableText
                value={item.name}
                onSave={(v) => {
                  onUpdateItem(item.id, { name: v });
                  setEditing(false);
                }}
              />
            ) : (
              <CardTitle className="font-semibold">{item.name}</CardTitle>
            )}
          </div>
          {hasCrud && (
            <ItemActionsMenu
              onEdit={() => setEditing(true)}
              onDelete={() => setShowDeleteDialog(true)}
              onSetDependencies={
                onUpdateItem && allItems
                  ? () => setShowDepPicker(true)
                  : undefined
              }
            />
          )}
        </div>
        <CardDescription className="line-clamp-2 leading-relaxed">
          {item.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge slug={item.categorySlug} title={item.categoryTitle} />
          {hasCrud && onUpdateItem ? (
            <ClickableRoadmapStatusBadge
              status={item.status}
              onStatusChange={(s) => onUpdateItem(item.id, { status: s })}
            />
          ) : null}
          {item.depends && item.depends.length > 0 && (
            <DependencyBadge depends={item.depends} itemNames={itemNames} />
          )}
        </div>
        {(item.started || item.completed) && (
          <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
            {item.started && <span>Started: {item.started}</span>}
            {item.completed && <span>Completed: {item.completed}</span>}
          </div>
        )}
        {sessionUrl && (
          <Link
            href={sessionUrl}
            data-testid="session-link"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View session
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
      {showDeleteDialog && onDeleteItem && (
        <DeleteItemDialog
          itemName={item.name}
          onConfirm={() => {
            onDeleteItem(item.id);
            setShowDeleteDialog(false);
          }}
        />
      )}
      {showDepPicker && onUpdateItem && allItems && (
        <div className="border-t p-2">
          <RoadmapDependencyPicker
            currentItemId={item.id}
            currentDeps={item.depends ?? []}
            allItems={allItems}
            onChange={(deps) => {
              onUpdateItem(item.id, { depends: deps });
            }}
          />
          <button
            type="button"
            className="mt-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowDepPicker(false)}
          >
            Done
          </button>
        </div>
      )}
    </Card>
  );
}
