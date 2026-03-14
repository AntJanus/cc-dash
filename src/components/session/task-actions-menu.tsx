"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2, Link } from "lucide-react";

interface TaskActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onSetDependency: () => void;
}

export function TaskActionsMenu({
  onEdit,
  onDelete,
  onSetDependency,
}: TaskActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-label="Task actions"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border bg-popover p-1 shadow-md"
        >
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              onSetDependency();
              setOpen(false);
            }}
          >
            <Link className="h-4 w-4" />
            Set Dependency
          </button>
        </div>
      )}
    </div>
  );
}
