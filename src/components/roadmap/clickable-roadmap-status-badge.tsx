"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type RoadmapItemStatus = "planned" | "in-progress" | "done" | "idea";

interface StatusConfig {
  label: string;
  className: string;
  dotClassName: string;
}

const statusConfig: Record<RoadmapItemStatus, StatusConfig> = {
  idea: {
    label: "Idea",
    className:
      "border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400",
    dotClassName: "bg-slate-400",
  },
  planned: {
    label: "Planned",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    dotClassName: "bg-blue-500",
  },
  "in-progress": {
    label: "Active",
    className: "bg-amber-500 text-white",
    dotClassName: "bg-amber-500",
  },
  done: {
    label: "Done",
    className: "bg-green-600 text-white",
    dotClassName: "bg-green-600",
  },
};

const allStatuses: RoadmapItemStatus[] = [
  "idea",
  "planned",
  "in-progress",
  "done",
];

interface ClickableRoadmapStatusBadgeProps {
  status: string;
  onStatusChange: (status: string) => void;
}

export function ClickableRoadmapStatusBadge({
  status,
  onStatusChange,
}: ClickableRoadmapStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const config =
    statusConfig[status as RoadmapItemStatus] ?? statusConfig["planned"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-5 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
          config.className,
        )}
      >
        {config.label}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 w-40 rounded-md border bg-popover p-1 shadow-md"
        >
          {allStatuses.map((s) => {
            const sc = statusConfig[s];
            return (
              <button
                key={s}
                role="menuitem"
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => {
                  onStatusChange(s);
                  setOpen(false);
                }}
              >
                <span className={cn("h-2 w-2 rounded-full", sc.dotClassName)} />
                {sc.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
