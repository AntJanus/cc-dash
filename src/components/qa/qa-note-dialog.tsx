"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QaNoteDialogProps {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  submitVariant?: "default" | "destructive";
  /** Returns null on success; an error message on failure (which keeps the dialog open). */
  onSubmit: (note: string) => Promise<string | null>;
  onClose: () => void;
}

/**
 * A modal that captures a required note before performing an action.
 * Used by Fail and Needs-Decision flows.
 */
export function QaNoteDialog({
  open,
  title,
  description,
  submitLabel,
  submitVariant = "default",
  onSubmit,
  onClose,
}: QaNoteDialogProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    if (!note.trim()) {
      setError("A note is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const failureMessage = await onSubmit(note.trim());
      if (failureMessage) {
        setError(failureMessage);
        return;
      }
      setNote("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setNote("");
    setError(null);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qa-note-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/10" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-background p-5 ring-1 ring-foreground/10 shadow-lg">
        <h2 id="qa-note-title" className="text-base font-medium">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <textarea
          aria-label="Note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={5}
          className="mt-3 w-full rounded-md border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="What was wrong, what you observed, anything actionable…"
          disabled={submitting}
          autoFocus
        />
        {error && (
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={submitVariant}
            onClick={handleSubmit}
            disabled={submitting || !note.trim()}
          >
            {submitting ? "Submitting…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
