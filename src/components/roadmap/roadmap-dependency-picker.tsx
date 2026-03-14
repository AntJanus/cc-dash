"use client";

interface RoadmapDependencyPickerProps {
  currentItemId: string;
  currentDeps: string[];
  allItems: Array<{ id: string; name: string }>;
  onChange: (deps: string[]) => void;
}

/**
 * Checkbox-based dependency picker for roadmap items.
 * Shows a list of all items except the current one, with checkboxes
 * for selecting which items the current item depends on.
 */
export function RoadmapDependencyPicker({
  currentItemId,
  currentDeps,
  allItems,
  onChange,
}: RoadmapDependencyPickerProps) {
  const availableItems = allItems.filter((item) => item.id !== currentItemId);

  if (availableItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No other items available</p>
    );
  }

  function handleToggle(itemId: string, checked: boolean) {
    if (checked) {
      onChange([...currentDeps, itemId]);
    } else {
      onChange(currentDeps.filter((id) => id !== itemId));
    }
  }

  function truncateName(name: string, maxLen: number = 40): string {
    if (name.length > maxLen) {
      return name.slice(0, maxLen) + "...";
    }
    return name;
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-2">
      {availableItems.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={currentDeps.includes(item.id)}
            onChange={(e) => handleToggle(item.id, e.target.checked)}
          />
          {truncateName(item.name)}
        </label>
      ))}
    </div>
  );
}
