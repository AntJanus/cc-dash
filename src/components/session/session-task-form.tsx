"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SessionTaskFormData {
  description: string;
  dependency: string;
}

interface SessionTaskFormProps {
  onSubmit: (data: SessionTaskFormData) => void | Promise<void>;
  onCancel: () => void;
  existingTasks: Array<{ id: string; description: string }>;
  initialValues?: SessionTaskFormData;
}

export function SessionTaskForm({
  onSubmit,
  onCancel,
  existingTasks,
  initialValues,
}: SessionTaskFormProps) {
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [dependency, setDependency] = useState(
    initialValues?.dependency ?? "none",
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ description: description.trim(), dependency });
      // Reset form if not in edit mode (no initialValues)
      if (!initialValues) {
        setDescription("");
        setDependency("none");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        placeholder="Task description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <select
        role="combobox"
        value={dependency}
        onChange={(e) => setDependency(e.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="none">None</option>
        {existingTasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.id}: {task.description}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
