import * as React from "react";

import { cn } from "@/lib/utils";

export type StickyNoteColor =
  | "sage"
  | "butter"
  | "blush"
  | "apricot"
  | "lavender"
  | "mist";

export type StickyNoteTilt = "left" | "none" | "right";

export type StickyNoteDecoration = "none" | "pin" | "tape";

export interface StickyNoteProps extends React.ComponentProps<"div"> {
  color?: StickyNoteColor;
  tilt?: StickyNoteTilt;
  decoration?: StickyNoteDecoration;
  /**
   * Decoration position when decoration is "pin" or "tape".
   * Defaults to "top-center".
   */
  decorationPosition?: "top-left" | "top-center" | "top-right";
}

const colorClass: Record<StickyNoteColor, string> = {
  sage: "sticky-note-sage",
  butter: "sticky-note-butter",
  blush: "sticky-note-blush",
  apricot: "sticky-note-apricot",
  lavender: "sticky-note-lavender",
  mist: "sticky-note-mist",
};

const tiltClass: Record<StickyNoteTilt, string> = {
  left: "sticky-note-tilt-left",
  none: "",
  right: "sticky-note-tilt-right",
};

const decorationPositionClass: Record<
  NonNullable<StickyNoteProps["decorationPosition"]>,
  string
> = {
  "top-left": "sticky-note-deco-left",
  "top-center": "sticky-note-deco-center",
  "top-right": "sticky-note-deco-right",
};

export function StickyNote({
  className,
  color = "butter",
  tilt = "none",
  decoration = "none",
  decorationPosition = "top-center",
  children,
  ...props
}: StickyNoteProps) {
  return (
    <div
      data-slot="sticky-note"
      data-color={color}
      data-tilt={tilt}
      data-decoration={decoration}
      className={cn(
        "sticky-note",
        colorClass[color],
        tiltClass[tilt],
        decoration !== "none" && decorationPositionClass[decorationPosition],
        className,
      )}
      {...props}
    >
      {decoration === "pin" && <span aria-hidden className="sticky-note-pin" />}
      {decoration === "tape" && (
        <span aria-hidden className="sticky-note-tape" />
      )}
      {children}
    </div>
  );
}
