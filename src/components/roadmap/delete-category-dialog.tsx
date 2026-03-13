"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteCategoryDialogProps {
  categoryName: string;
  itemCount: number;
  onConfirm: () => void;
  trigger?: React.ReactNode;
}

/**
 * Category deletion confirmation dialog.
 * Uses custom dialog pattern (not shadcn AlertDialog) for jsdom testability.
 */
export function DeleteCategoryDialog({
  categoryName,
  itemCount,
  onConfirm,
  trigger,
}: DeleteCategoryDialogProps) {
  const [open, setOpen] = useState(false);

  const description =
    itemCount > 0
      ? `This will delete the category and all ${itemCount} items in it. This action cannot be undone.`
      : "This will delete the empty category. This action cannot be undone.";

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label="Delete category"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
      {open && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="fixed inset-0 bg-black/10"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-background p-4 ring-1 ring-foreground/10 shadow-lg">
            <h2 className="text-base font-medium">
              Delete category &quot;{categoryName}&quot;?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
