"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RoadmapItemFormData {
  name: string;
  description: string;
  status: string;
}

interface RoadmapItemFormProps {
  onSubmit: (data: RoadmapItemFormData) => void;
  onCancel: () => void;
  initialValues?: RoadmapItemFormData;
}

export function RoadmapItemForm({
  onSubmit,
  onCancel,
  initialValues,
}: RoadmapItemFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [status, setStatus] = useState(initialValues?.status ?? "planned");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description, status });
    // Reset form if not in edit mode (no initialValues)
    if (!initialValues) {
      setName("");
      setDescription("");
      setStatus("planned");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select
        role="combobox"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="idea">Idea</option>
        <option value="planned">Planned</option>
        <option value="in-progress">Active</option>
        <option value="done">Done</option>
      </select>
      <div className="flex gap-2">
        <Button type="submit">Add</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
