"use client";

import { useTransition } from "react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { setProjectStatus } from "@/lib/actions/portfolio-actions";
import type { ProjectStatus } from "@/lib/schemas/portfolio";

interface PortfolioStatusMenuProps {
  slug: string;
  currentStatus: ProjectStatus;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] =
  [
    { value: "active", label: "Active", color: "var(--accent-teal)" },
    { value: "inactive", label: "Inactive", color: "var(--accent-violet)" },
    {
      value: "maintenance",
      label: "Maintenance",
      color: "var(--accent-amber)",
    },
  ];

export function PortfolioStatusMenu({
  slug,
  currentStatus,
}: PortfolioStatusMenuProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    const newStatus = e.target.value;
    startTransition(async () => {
      await setProjectStatus(slug, newStatus);
    });
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  const current = STATUS_OPTIONS.find((o) => o.value === currentStatus);

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1",
        isPending && "opacity-50",
      )}
      onClick={handleClick}
    >
      <Layers className="h-3.5 w-3.5" style={{ color: current?.color }} />
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="appearance-none bg-transparent text-sm font-medium cursor-pointer border-none outline-none pr-4"
        style={{ color: current?.color }}
        aria-label={`Portfolio status for ${slug}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
