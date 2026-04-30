import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Connector } from "@/components/ui/connector";

function renderConnector(
  props: Partial<React.ComponentProps<typeof Connector>> = {},
) {
  return render(
    <Connector
      width={400}
      height={300}
      from={{ x: 50, y: 50 }}
      to={{ x: 350, y: 250 }}
      {...props}
    />,
  );
}

function getSvg(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector("[data-slot=connector]");
  if (!svg) throw new Error("connector svg not found");
  return svg as SVGSVGElement;
}

describe("Connector", () => {
  afterEach(cleanup);

  it("renders an svg with the connector slot, sized to width/height", () => {
    const { container } = renderConnector();
    const svg = getSvg(container);
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.getAttribute("width")).toBe("400");
    expect(svg.getAttribute("height")).toBe("300");
    expect(svg.getAttribute("viewBox")).toBe("0 0 400 300");
  });

  it("defaults to the dotted variant", () => {
    const { container } = renderConnector();
    const svg = getSvg(container);
    expect(svg).toHaveAttribute("data-variant", "dotted");
    expect(svg).toHaveClass("connector-dotted");
  });

  it.each([
    ["dotted", "1 5"],
    ["dashed", "8 6"],
    ["solid", "0"],
  ] as const)("applies dash array for variant=%s", (variant, expected) => {
    const { container } = renderConnector({ variant });
    const svg = getSvg(container);
    const path = svg.querySelector("path:not([fill])");
    // Path with stroke is the second path when arrowhead is on; otherwise the only one.
    const strokePath = svg.querySelectorAll("path");
    const lastPath = strokePath[strokePath.length - 1]!;
    expect(lastPath.getAttribute("stroke-dasharray")).toBe(expected);
    expect(svg).toHaveClass(`connector-${variant}`);
    void path;
  });

  it("toggles active class and data-active attribute", () => {
    const { container } = renderConnector({ active: true });
    const svg = getSvg(container);
    expect(svg).toHaveClass("connector-active");
    expect(svg).toHaveAttribute("data-active", "true");
  });

  it("renders a marker definition only when arrowhead is true", () => {
    const noArrow = renderConnector({ arrowhead: false });
    expect(noArrow.container.querySelector("marker")).toBeNull();
    cleanup();

    const withArrow = renderConnector({ arrowhead: true });
    expect(withArrow.container.querySelector("marker")).not.toBeNull();
    // Pick the path that actually has a marker-end (the stroked one),
    // not the path inside the marker definition.
    const path = withArrow.container.querySelector("path[marker-end]");
    expect(path).not.toBeNull();
    const markerEnd = path!.getAttribute("marker-end") ?? "";
    expect(markerEnd).toMatch(/^url\(#connector-\d+-arrow\)$/);
  });

  it("builds a cubic bezier path between from and to", () => {
    const { container } = renderConnector({
      from: { x: 0, y: 0 },
      to: { x: 100, y: 0 },
      curvature: 0.5,
    });
    const path = getSvg(container).querySelector("path[stroke]");
    const d = path?.getAttribute("d");
    // M 0 0 C 50 0, 50 0, 100 0   (control points on x-axis with curvature 0.5)
    expect(d).toBe("M 0 0 C 50 0, 50 0, 100 0");
  });

  it("passes a custom color via inline style", () => {
    const { container } = renderConnector({ color: "#ff0000" });
    const svg = getSvg(container);
    // jsdom normalizes named colors, but hex values round-trip cleanly.
    expect(svg.getAttribute("style")).toMatch(
      /color:\s*(?:#ff0000|rgb\(255, 0, 0\))/,
    );
  });

  it("respects custom strokeWidth", () => {
    const { container } = renderConnector({ strokeWidth: 4 });
    const path = getSvg(container).querySelector("path[stroke]");
    expect(path?.getAttribute("stroke-width")).toBe("4");
  });

  it("merges custom className", () => {
    const { container } = renderConnector({ className: "extra" });
    const svg = getSvg(container);
    expect(svg).toHaveClass("connector");
    expect(svg).toHaveClass("extra");
  });
});
