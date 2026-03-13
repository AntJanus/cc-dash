"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
import type { BoardItem } from "./roadmap-board";

interface RoadmapCardProps {
  item: BoardItem;
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
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
}

/**
 * A Kanban board card for a roadmap item.
 * Shows name, description, category badge, dependencies, dates, and session link.
 * When CRUD callbacks are provided, shows action menu and clickable status badge.
 */
export function RoadmapCard({
  item,
  sessionRefs,
  itemNames,
  onUpdateItem,
  onDeleteItem,
}: RoadmapCardProps) {
  const sessionUrl = sessionRefs[item.id];
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const hasCrud = Boolean(onUpdateItem);

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-1">
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
              <CardTitle>{item.name}</CardTitle>
            )}
          </div>
          {hasCrud && (
            <ItemActionsMenu
              onEdit={() => setEditing(true)}
              onDelete={() => setShowDeleteDialog(true)}
            />
          )}
        </div>
        <CardDescription className="line-clamp-2">
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
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {item.started && <span>Started: {item.started}</span>}
            {item.completed && <span>Completed: {item.completed}</span>}
          </div>
        )}
        {sessionUrl && (
          <Link
            href={sessionUrl}
            data-testid="session-link"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
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
    </Card>
  );
}
