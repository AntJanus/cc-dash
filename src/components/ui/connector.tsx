import * as React from "react";

import { cn } from "@/lib/utils";

export type ConnectorVariant = "dotted" | "dashed" | "solid";

export interface Point {
  x: number;
  y: number;
}

export interface ConnectorProps extends Omit<
  React.ComponentProps<"svg">,
  "from" | "to"
> {
  /** Total width of the SVG viewport. */
  width: number;
  /** Total height of the SVG viewport. */
  height: number;
  /** Start point in viewport coordinates. */
  from: Point;
  /** End point in viewport coordinates. */
  to: Point;
  /** Stroke style. Defaults to "dotted". */
  variant?: ConnectorVariant;
  /** Animate dash-offset along the path. */
  active?: boolean;
  /** Render an arrowhead at the `to` end. */
  arrowhead?: boolean;
  /** Stroke width in px. Defaults to 1.75. */
  strokeWidth?: number;
  /** CSS color for the path. Defaults to currentColor. */
  color?: string;
  /** Curvature of the bezier control offset (0 = straight). Defaults to 0.4. */
  curvature?: number;
}

const dashArray: Record<ConnectorVariant, string> = {
  dotted: "1 5",
  dashed: "8 6",
  solid: "0",
};

function buildPath(from: Point, to: Point, curvature: number): string {
  const dx = to.x - from.x;
  // Horizontal-ish bezier — control points pulled out along x for a soft S-curve.
  const cp1x = from.x + dx * curvature;
  const cp1y = from.y;
  const cp2x = to.x - dx * curvature;
  const cp2y = to.y;
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

let connectorIdCounter = 0;
function useUniqueId(prefix: string): string {
  // useId would be cleaner but we want a stable counter for tests too
  const ref = React.useRef<string | null>(null);
  if (ref.current === null) {
    connectorIdCounter += 1;
    ref.current = `${prefix}-${connectorIdCounter}`;
  }
  return ref.current;
}

export function Connector({
  className,
  width,
  height,
  from,
  to,
  variant = "dotted",
  active = false,
  arrowhead = false,
  strokeWidth = 1.75,
  color,
  curvature = 0.4,
  ...props
}: ConnectorProps) {
  const id = useUniqueId("connector");
  const markerId = `${id}-arrow`;
  const path = buildPath(from, to, curvature);

  return (
    <svg
      data-slot="connector"
      data-active={active ? "true" : "false"}
      data-variant={variant}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn(
        "connector",
        active && "connector-active",
        `connector-${variant}`,
        className,
      )}
      style={{ color }}
      aria-hidden="true"
      {...props}
    >
      {arrowhead && (
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" stroke="none" />
          </marker>
        </defs>
      )}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray[variant]}
        markerEnd={arrowhead ? `url(#${markerId})` : undefined}
      />
    </svg>
  );
}
