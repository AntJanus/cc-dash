"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteIdea } from "@/lib/actions/ideas-actions";

interface DeleteIdeaDialogProps {
  ideaId: string;
  ideaTitle: string;
  ideaStatus: string;
  onSuccess?: () => void;
}

/**
 * Confirmation dialog for idea deletion.
 * Uses custom inline dialog pattern (same as DeleteItemDialog) for jsdom testability.
 */
export function DeleteIdeaDialog({
  ideaId,
  ideaTitle,
  ideaStatus,
  onSuccess,
}: DeleteIdeaDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const showExtraWarning =
    ideaStatus === "started" || ideaStatus === "complete";

  async function handleConfirm() {
    setDeleting(true);
    const result = await deleteIdea({ id: ideaId });
    setDeleting(false);

    if (result.success) {
      setOpen(false);
      onSuccess?.();
      router.push("/ideas");
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label="Delete idea"
      >
        <Trash2 className="size-4" />
      </Button>

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
              Delete &quot;{ideaTitle}&quot;?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This cannot be undone.
            </p>
            {showExtraWarning && (
              <p className="mt-1 text-sm text-muted-foreground">
                Note: The project directory will not be deleted.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
