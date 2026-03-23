"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateIdeaMetadata } from "@/lib/actions/ideas-actions";
import type { IdeaItem } from "@/lib/schemas/ideas";

interface IdeaMetadataEditorProps {
  idea: IdeaItem;
  onSuccess?: () => void;
}

/**
 * Inline editor for idea metadata (status, path, stack).
 * Optimistic update: save prev state, update locally, revert on failure.
 */
export function IdeaMetadataEditor({
  idea,
  onSuccess,
}: IdeaMetadataEditorProps) {
  const [status, setStatus] = useState(idea.status);
  const [path, setPath] = useState(idea.path ?? "");
  const [stackInput, setStackInput] = useState(idea.stack?.join(", ") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const stack = stackInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = await updateIdeaMetadata({
      id: idea.id,
      status,
      path: path || undefined,
      stack,
    });

    setSaving(false);

    if (result.success) {
      onSuccess?.();
    } else {
      // Revert to original values on failure
      setStatus(idea.status);
      setPath(idea.path ?? "");
      setStackInput(idea.stack?.join(", ") ?? "");
      setError(result.errors[0]?.message ?? "Failed to update metadata");
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Metadata</h3>

      <div>
        <label
          htmlFor="meta-status"
          className="mb-1 block text-sm text-muted-foreground"
        >
          Status
        </label>
        <select
          id="meta-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="not-started">Not Started</option>
          <option value="started">Started</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="meta-path"
          className="mb-1 block text-sm text-muted-foreground"
        >
          Path
        </label>
        <Input
          id="meta-path"
          placeholder="project-slug"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="meta-stack"
          className="mb-1 block text-sm text-muted-foreground"
        >
          Stack (comma-separated)
        </label>
        <Input
          id="meta-stack"
          placeholder="TypeScript, React"
          value={stackInput}
          onChange={(e) => setStackInput(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
