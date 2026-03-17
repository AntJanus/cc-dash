"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateIdeaBody } from "@/lib/actions/ideas-actions";
import type { IdeaItem } from "@/lib/schemas/ideas";

interface IdeaBodyEditorProps {
  idea: IdeaItem;
  onSuccess?: () => void;
  /** Render function for view mode content */
  children: React.ReactNode;
}

/**
 * Toggle between view mode (existing body rendering) and edit mode (textarea).
 * Save calls updateIdeaBody server action. Cancel reverts without saving.
 */
export function IdeaBodyEditor({
  idea,
  onSuccess,
  children,
}: IdeaBodyEditorProps) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(idea.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const result = await updateIdeaBody({ id: idea.id, body });

    setSaving(false);

    if (result.success) {
      setEditing(false);
      onSuccess?.();
    } else {
      setError(result.errors[0]?.message ?? "Failed to update body");
    }
  }

  function handleCancel() {
    setBody(idea.body);
    setError(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Edit Body</h3>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[200px] w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Markdown content..."
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Body</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditing(true)}
          aria-label="Edit body"
        >
          <Pencil className="size-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}
