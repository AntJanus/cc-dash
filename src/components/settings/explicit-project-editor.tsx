"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExplicitProjectEditorProps {
  projects: Array<{ path: string; name: string }>;
  onChange: (projects: Array<{ path: string; name: string }>) => void;
}

/**
 * Manages array of { path, name } objects for explicit project registration.
 *
 * Provides two inputs (path + name) with an Add button.
 * Validates both fields required and no duplicate paths.
 */
export function ExplicitProjectEditor({
  projects,
  onChange,
}: ExplicitProjectEditorProps) {
  const [pathValue, setPathValue] = useState("");
  const [nameValue, setNameValue] = useState("");

  function handleAdd() {
    const trimmedPath = pathValue.trim();
    const trimmedName = nameValue.trim();
    if (!trimmedPath || !trimmedName) return;
    if (projects.some((p) => p.path === trimmedPath)) return;
    onChange([...projects, { path: trimmedPath, name: trimmedName }]);
    setPathValue("");
    setNameValue("");
  }

  function handleRemove(index: number) {
    onChange(projects.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Explicit Projects</h3>

      {projects.length > 0 && (
        <ul className="space-y-1">
          {projects.map((project, index) => (
            <li
              key={`${project.path}-${index}`}
              className="flex items-center justify-between rounded border px-3 py-1.5"
            >
              <div className="flex gap-3">
                <span className="font-mono text-sm">{project.path}</span>
                <span className="text-muted-foreground text-sm">
                  {project.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemove(index)}
                aria-label={`Remove ${project.name}`}
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
          value={pathValue}
          onChange={(e) => setPathValue(e.target.value)}
          placeholder="Project path"
          className="flex-1 rounded border bg-background px-3 py-1.5 text-sm font-mono"
        />
        <input
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          placeholder="Project name"
          className="flex-1 rounded border bg-background px-3 py-1.5 text-sm"
        />
        <Button variant="outline" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}
