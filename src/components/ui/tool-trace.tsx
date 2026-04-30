import * as React from "react";

import { cn } from "@/lib/utils";
import { StatusDot, type StatusDotState } from "@/components/ui/status-dot";

export interface ToolTraceEntry {
  id: string;
  /** ISO timestamp or any pre-formatted display string. Rendered verbatim. */
  timestamp: string;
  /** Actor performing the action (agent name, user, system). */
  actor: string;
  /** Short action label — typically a tool call signature or verb phrase. */
  action: string;
  /** Optional multi-line output / result. Wrapped in monospace block. */
  output?: string;
  /** Optional state for the leading dot. */
  state?: StatusDotState;
}

export interface ToolTracePanelProps extends React.ComponentProps<"div"> {
  entries: ToolTraceEntry[];
  /** Optional title shown at the top of the panel. */
  title?: string;
  /** Optional empty-state message. Shown when entries is empty. */
  emptyMessage?: string;
}

export function ToolTracePanel({
  className,
  entries,
  title = "Tool Trace",
  emptyMessage = "No tool activity yet.",
  ...props
}: ToolTracePanelProps) {
  return (
    <div
      data-slot="tool-trace"
      className={cn("tool-trace", className)}
      {...props}
    >
      {title && <div className="tool-trace-title">{title}</div>}
      {entries.length === 0 ? (
        <div className="tool-trace-empty">{emptyMessage}</div>
      ) : (
        <ol className="tool-trace-list" role="log" aria-label={title}>
          {entries.map((entry) => (
            <li
              key={entry.id}
              data-slot="tool-trace-entry"
              className="tool-trace-entry"
            >
              <span className="tool-trace-leading">
                {entry.state ? (
                  <StatusDot state={entry.state} />
                ) : (
                  <span aria-hidden className="tool-trace-bullet" />
                )}
              </span>
              <time className="tool-trace-time">{entry.timestamp}</time>
              <span className="tool-trace-actor">{entry.actor}</span>
              <span className="tool-trace-action">{entry.action}</span>
              {entry.output !== undefined && entry.output !== "" && (
                <pre className="tool-trace-output">{entry.output}</pre>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
