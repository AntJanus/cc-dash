import * as React from "react";

import { cn } from "@/lib/utils";
import { StatusDot, type StatusDotState } from "@/components/ui/status-dot";

export interface AgentChipProps extends React.ComponentProps<"div"> {
  /** Display name for the agent. */
  name: string;
  /** Optional avatar URL. If omitted, a serif initial token is rendered. */
  avatarUrl?: string;
  /** Optional 1-2 letter initials. Defaults to first letter of `name`. */
  initials?: string;
  /** Optional status — adds a colored dot next to the name. */
  state?: StatusDotState;
  /** When true, chip pulses with a heartbeat line. Defaults true if state is "running". */
  active?: boolean;
}

function deriveInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

export function AgentChip({
  className,
  name,
  avatarUrl,
  initials,
  state,
  active,
  ...props
}: AgentChipProps) {
  const isActive = active ?? state === "running";
  const computedInitials = initials ?? deriveInitials(name);
  return (
    <div
      data-slot="agent-chip"
      data-active={isActive ? "true" : "false"}
      className={cn("agent-chip", isActive && "agent-chip-active", className)}
      {...props}
    >
      <span aria-hidden className="agent-chip-avatar">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="agent-chip-avatar-img" />
        ) : (
          <span className="agent-chip-avatar-initials">{computedInitials}</span>
        )}
      </span>
      <span className="agent-chip-name">{name}</span>
      {state && <StatusDot state={state} className="agent-chip-status" />}
    </div>
  );
}
