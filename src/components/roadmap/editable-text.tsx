"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
}

export function EditableText({ value, onSave, className }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      // Always call onSave on Enter, even if unchanged
      setEditing(false);
      onSave(draft);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onSave(draft);
        }}
        onKeyDown={handleKeyDown}
        autoFocus
        className={cn(
          "h-7 w-full rounded border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
          className,
        )}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        "cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50",
        className,
      )}
    >
      {value}
    </span>
  );
}
