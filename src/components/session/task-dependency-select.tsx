"use client";

interface TaskDependencySelectProps {
  currentTaskId: string;
  tasks: Array<{ id: string; description: string }>;
  value: string;
  onChange: (dep: string) => void;
}

export function TaskDependencySelect({
  currentTaskId,
  tasks,
  value,
  onChange,
}: TaskDependencySelectProps) {
  const availableTasks = tasks.filter((t) => t.id !== currentTaskId);

  return (
    <select
      role="combobox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <option value="none">None</option>
      {availableTasks.map((task) => (
        <option key={task.id} value={task.id}>
          {task.id}:{" "}
          {task.description.length > 30
            ? task.description.slice(0, 30) + "..."
            : task.description}
        </option>
      ))}
    </select>
  );
}
