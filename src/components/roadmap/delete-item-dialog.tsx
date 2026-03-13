"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteItemDialogProps {
  itemName: string;
  onConfirm: () => void;
  trigger?: React.ReactNode;
}

/**
 * Item deletion confirmation dialog.
 * Uses custom dialog pattern (not shadcn AlertDialog) for jsdom testability.
 */
export function DeleteItemDialog({
  itemName,
  onConfirm,
  trigger,
}: DeleteItemDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label="Delete item"
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
              Delete &quot;{itemName}&quot;?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This will remove the item from the roadmap file. This action
              cannot be undone.
            </p>
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
