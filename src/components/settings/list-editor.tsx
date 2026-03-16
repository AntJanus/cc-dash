"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

/**
 * Reusable component for managing string arrays (scan_dirs, exclude_dirs).
 *
 * Renders a labeled list with add/remove controls. Trims whitespace,
 * rejects empty and duplicate entries.
 */
export function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: ListEditorProps) {
  const [inputValue, setInputValue] = useState("");

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setInputValue("");
  }

  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{label}</h3>

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center justify-between rounded border px-3 py-1.5"
            >
              <span className="font-mono text-sm">{item}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemove(index)}
                aria-label={`Remove ${item}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded border bg-background px-3 py-1.5 text-sm"
        />
        <Button variant="outline" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}
