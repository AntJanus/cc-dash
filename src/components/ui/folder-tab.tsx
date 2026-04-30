import * as React from "react";

import { cn } from "@/lib/utils";

export interface FolderTabsProps extends React.ComponentProps<"div"> {
  /**
   * "attached" tabs visually merge into a card/panel below. "detached" tabs
   * float as standalone chips. Defaults to "attached".
   */
  variant?: "attached" | "detached";
}

export function FolderTabs({
  className,
  variant = "attached",
  ...props
}: FolderTabsProps) {
  return (
    <div
      data-slot="folder-tabs"
      data-variant={variant}
      role="tablist"
      className={cn(
        "folder-tabs",
        variant === "detached" && "folder-tabs-detached",
        className,
      )}
      {...props}
    />
  );
}

export interface FolderTabProps extends React.ComponentProps<"button"> {
  active?: boolean;
}

export function FolderTab({
  className,
  active = false,
  type = "button",
  ...props
}: FolderTabProps) {
  return (
    <button
      data-slot="folder-tab"
      data-active={active ? "true" : "false"}
      role="tab"
      aria-selected={active}
      type={type}
      className={cn("folder-tab", active && "folder-tab-active", className)}
      {...props}
    />
  );
}
