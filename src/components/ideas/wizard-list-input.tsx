"use client";

/**
 * Reusable dynamic list input component for add/remove string items.
 *
 * Used by wizard Steps 4 (Requirements), 5 (Inspirations), and 6 (Open Questions).
 * Supports adding via button click or Enter key, removing individual items,
 * and guards against empty/whitespace-only entries.
 */

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WizardListInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
  placeholder?: string;
}

export function WizardListInput({
  items,
  onChange,
  label,
  placeholder,
}: WizardListInputProps) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  }

  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                aria-label={`Remove ${item}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
