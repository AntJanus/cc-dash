import * as React from "react";

import { cn } from "@/lib/utils";

export type StatusDotState =
  | "running"
  | "draft"
  | "blocked"
  | "idle"
  | "archived";

const stateClass: Record<StatusDotState, string> = {
  running: "status-dot-running",
  draft: "status-dot-draft",
  blocked: "status-dot-blocked",
  idle: "status-dot-idle",
  archived: "status-dot-archived",
};

const stateLabel: Record<StatusDotState, string> = {
  running: "Running",
  draft: "Draft",
  blocked: "Blocked",
  idle: "Idle",
  archived: "Archived",
};

export interface StatusDotProps extends React.ComponentProps<"span"> {
  state: StatusDotState;
  /** When true, the dot pulses gently. Defaults to true for "running". */
  pulse?: boolean;
  /** Accessible label override. Defaults to a state-derived label. */
  label?: string;
}

export function StatusDot({
  className,
  state,
  pulse,
  label,
  ...props
}: StatusDotProps) {
  const shouldPulse = pulse ?? state === "running";
  const accessibleLabel = label ?? stateLabel[state];
  return (
    <span
      data-slot="status-dot"
      data-state={state}
      role="img"
      aria-label={accessibleLabel}
      className={cn(
        "status-dot",
        stateClass[state],
        shouldPulse && "status-dot-pulse",
        className,
      )}
      {...props}
    />
  );
}
