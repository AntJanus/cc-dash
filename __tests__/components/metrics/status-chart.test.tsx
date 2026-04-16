import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StatusChart } from "@/components/metrics/status-chart";

describe("StatusChart", () => {
  afterEach(cleanup);

  it("renders all four status labels", () => {
    const dist = { active: 5, stalled: 3, complete: 2, inactive: 10 };
    render(<StatusChart distribution={dist} total={20} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Stalled")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders counts and percentages", () => {
    const dist = { active: 5, stalled: 3, complete: 2, inactive: 10 };
    render(<StatusChart distribution={dist} total={20} />);

    expect(screen.getByText("5 (25%)")).toBeInTheDocument();
    expect(screen.getByText("3 (15%)")).toBeInTheDocument();
    expect(screen.getByText("2 (10%)")).toBeInTheDocument();
    expect(screen.getByText("10 (50%)")).toBeInTheDocument();
  });

  it("handles zero total without crashing", () => {
    const dist = { active: 0, stalled: 0, complete: 0, inactive: 0 };
    render(<StatusChart distribution={dist} total={0} />);

    // All four rows show "0 (0%)"
    expect(screen.getAllByText("0 (0%)")).toHaveLength(4);
  });
});
