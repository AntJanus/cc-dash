"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addIdea } from "@/lib/actions/ideas-actions";

interface IdeaFormProps {
  onSuccess?: () => void;
}

/**
 * Quick-add modal form for new project ideas.
 * Uses custom inline dialog pattern (not shadcn Dialog) for jsdom testability.
 */
export function IdeaForm({ onSuccess }: IdeaFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("not-started");
  const [stackInput, setStackInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setTitle("");
    setStatus("not-started");
    setStackInput("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);

    const stack = stackInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = await addIdea({ title: title.trim(), status, stack });

    setSubmitting(false);

    if (result.success) {
      resetForm();
      setOpen(false);
      onSuccess?.();
    } else {
      setError(result.errors[0]?.message ?? "Failed to add idea");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Add Idea"
      >
        <Plus className="mr-1 size-4" />
        Add Idea
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="fixed inset-0 bg-black/10"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-background p-6 ring-1 ring-foreground/10 shadow-lg">
            <h2 className="mb-4 text-lg font-medium">Add New Idea</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="idea-title"
                  className="mb-1 block text-sm font-medium"
                >
                  Title
                </label>
                <Input
                  id="idea-title"
                  placeholder="Idea title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="idea-status"
                  className="mb-1 block text-sm font-medium"
                >
                  Status
                </label>
                <select
                  id="idea-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="not-started">Not Started</option>
                  <option value="started">Started</option>
                  <option value="complete">Complete</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="idea-stack"
                  className="mb-1 block text-sm font-medium"
                >
                  Stack (comma-separated)
                </label>
                <Input
                  id="idea-stack"
                  placeholder="TypeScript, React, Node"
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="mt-1 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Idea"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
