import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  ThemeSwatchPicker,
  type ThemeSwatchOption,
} from "@/components/ui/theme-swatch";

const OPTIONS: ThemeSwatchOption[] = [
  { id: "sage", color: "var(--note-sage)", label: "Sage" },
  { id: "butter", color: "var(--note-butter)", label: "Butter" },
  { id: "blush", color: "var(--note-blush)", label: "Blush" },
];

describe("ThemeSwatchPicker", () => {
  afterEach(cleanup);

  it("renders one swatch per option as a radio role", () => {
    render(<ThemeSwatchPicker options={OPTIONS} />);
    const swatches = screen.getAllByRole("radio");
    expect(swatches).toHaveLength(3);
    expect(swatches[0]).toHaveAttribute("aria-label", "Sage");
    expect(swatches[1]).toHaveAttribute("aria-label", "Butter");
    expect(swatches[2]).toHaveAttribute("aria-label", "Blush");
  });

  it("marks the controlled value as selected", () => {
    render(<ThemeSwatchPicker options={OPTIONS} value="butter" />);
    const butter = screen.getByRole("radio", { name: "Butter" });
    expect(butter).toHaveAttribute("aria-checked", "true");
    expect(butter).toHaveAttribute("data-selected", "true");
    expect(butter).toHaveClass("theme-swatch-selected");
  });

  it("fires onChange with the new id when a swatch is clicked (controlled)", () => {
    const handleChange = vi.fn();
    render(
      <ThemeSwatchPicker
        options={OPTIONS}
        value="sage"
        onChange={handleChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Blush" }));
    expect(handleChange).toHaveBeenCalledWith("blush");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("updates internal state when uncontrolled", () => {
    render(<ThemeSwatchPicker options={OPTIONS} defaultValue="sage" />);
    expect(screen.getByRole("radio", { name: "Sage" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("radio", { name: "Butter" }));
    expect(screen.getByRole("radio", { name: "Butter" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Sage" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("does not change selection when controlled and onChange ignores the call", () => {
    const handleChange = vi.fn();
    render(
      <ThemeSwatchPicker
        options={OPTIONS}
        value="sage"
        onChange={handleChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Butter" }));
    // Controlled — value didn't change because parent ignored onChange.
    expect(screen.getByRole("radio", { name: "Sage" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("renders labels by default and hides them when showLabel=false", () => {
    const opts: ThemeSwatchOption[] = [
      { id: "a", color: "red", label: "A" },
      { id: "b", color: "blue", label: "B", showLabel: false },
    ];
    render(<ThemeSwatchPicker options={opts} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("B")).toBeNull();
  });

  it("applies the size prop to the tile dimensions", () => {
    render(<ThemeSwatchPicker options={OPTIONS} size={64} />);
    const sage = screen.getByRole("radio", { name: "Sage" });
    const tile = sage.querySelector(".theme-swatch-tile") as HTMLElement;
    expect(tile.style.width).toBe("64px");
    expect(tile.style.height).toBe("64px");
  });

  it("renders the radiogroup container with picker class", () => {
    render(<ThemeSwatchPicker options={OPTIONS} />);
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveClass("theme-swatch-picker");
  });

  it("merges custom className on the radiogroup", () => {
    render(<ThemeSwatchPicker options={OPTIONS} className="extra" />);
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveClass("theme-swatch-picker");
    expect(group).toHaveClass("extra");
  });
});
