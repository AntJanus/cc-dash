"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  className: string;
  dotClassName: string;
}

const statusConfig: Record<string, StatusConfig> = {
  "in-progress": {
    label: "In Progress",
    className: "bg-amber-500 text-white",
    dotClassName: "bg-amber-500",
  },
  paused: {
    label: "Paused",
    className: "bg-gray-400 text-white",
    dotClassName: "bg-gray-400",
  },
  completed: {
    label: "Completed",
    className: "bg-green-600 text-white",
    dotClassName: "bg-green-600",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-600 text-white",
    dotClassName: "bg-red-600",
  },
};

const allStatuses = ["in-progress", "paused", "completed", "blocked"] as const;

interface SessionStatusBadgeProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
}

export function SessionStatusBadge({
  status,
  onStatusChange,
}: SessionStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const config = statusConfig[status] ?? statusConfig["in-progress"];

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
          "inline-flex h-5 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium whitespace-nowrap",
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
