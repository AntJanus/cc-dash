import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StickyNote } from "@/components/ui/sticky-note";

describe("StickyNote", () => {
  afterEach(cleanup);

  it("renders children inside a sticky-note container", () => {
    render(<StickyNote>hello world</StickyNote>);
    const note = screen
      .getByText("hello world")
      .closest("[data-slot=sticky-note]");
    expect(note).not.toBeNull();
    expect(note).toHaveClass("sticky-note");
  });

  it.each(["sage", "butter", "blush", "apricot", "lavender", "mist"] as const)(
    "applies the %s color class",
    (color) => {
      render(<StickyNote color={color}>note</StickyNote>);
      const note = screen.getByText("note").closest("[data-slot=sticky-note]");
      expect(note).toHaveClass(`sticky-note-${color}`);
      expect(note).toHaveAttribute("data-color", color);
    },
  );

  it("defaults color to butter when no color prop is passed", () => {
    render(<StickyNote>default</StickyNote>);
    const note = screen.getByText("default").closest("[data-slot=sticky-note]");
    expect(note).toHaveClass("sticky-note-butter");
    expect(note).toHaveAttribute("data-color", "butter");
  });

  it.each([
    ["left", "sticky-note-tilt-left"],
    ["right", "sticky-note-tilt-right"],
  ] as const)("applies tilt=%s class %s", (tilt, expected) => {
    render(<StickyNote tilt={tilt}>tilted</StickyNote>);
    const note = screen.getByText("tilted").closest("[data-slot=sticky-note]");
    expect(note).toHaveClass(expected);
  });

  it("does not add a tilt class when tilt is none", () => {
    render(<StickyNote tilt="none">flat</StickyNote>);
    const note = screen.getByText("flat").closest("[data-slot=sticky-note]");
    expect(note?.className).not.toMatch(/sticky-note-tilt-/);
  });

  it("renders a pin span when decoration is pin", () => {
    render(
      <StickyNote decoration="pin" decorationPosition="top-right">
        pinned
      </StickyNote>,
    );
    const note = screen.getByText("pinned").closest("[data-slot=sticky-note]");
    expect(note).toHaveClass("sticky-note-deco-right");
    expect(note?.querySelector(".sticky-note-pin")).not.toBeNull();
    expect(note?.querySelector(".sticky-note-tape")).toBeNull();
  });

  it("renders a tape span when decoration is tape", () => {
    render(<StickyNote decoration="tape">taped</StickyNote>);
    const note = screen.getByText("taped").closest("[data-slot=sticky-note]");
    expect(note?.querySelector(".sticky-note-tape")).not.toBeNull();
    expect(note?.querySelector(".sticky-note-pin")).toBeNull();
  });

  it("renders no decoration span when decoration is none", () => {
    render(<StickyNote>plain</StickyNote>);
    const note = screen.getByText("plain").closest("[data-slot=sticky-note]");
    expect(note?.querySelector(".sticky-note-pin")).toBeNull();
    expect(note?.querySelector(".sticky-note-tape")).toBeNull();
  });

  it("merges additional className via cn()", () => {
    render(<StickyNote className="extra-class">merged</StickyNote>);
    const note = screen.getByText("merged").closest("[data-slot=sticky-note]");
    expect(note).toHaveClass("sticky-note");
    expect(note).toHaveClass("extra-class");
  });

  it("forwards rest props (e.g., onClick, role) to the root div", () => {
    let clicked = false;
    render(
      <StickyNote role="note" onClick={() => (clicked = true)}>
        click me
      </StickyNote>,
    );
    const note = screen.getByRole("note");
    expect(note).toBeInTheDocument();
    note.click();
    expect(clicked).toBe(true);
  });
});
