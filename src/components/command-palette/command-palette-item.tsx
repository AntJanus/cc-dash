"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteItemProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  isSelected: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

export function CommandPaletteItem({
  icon: Icon,
  label,
  shortcut,
  isSelected,
  onSelect,
  onMouseEnter,
}: CommandPaletteItemProps) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 mx-1 transition-colors",
        isSelected
          ? "bg-accent/10 ring-1 ring-inset ring-foreground/5"
          : "hover:bg-accent/10",
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <Icon
        className="size-4 shrink-0"
        style={{ color: "var(--text-muted)" }}
      />
      <span className="flex-1 truncate text-sm">{label}</span>
      {shortcut && (
        <span
          className="shrink-0 text-sm font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {shortcut}
        </span>
      )}
    </div>
  );
}
