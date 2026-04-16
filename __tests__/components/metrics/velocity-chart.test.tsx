import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { VelocityChart } from "@/components/metrics/velocity-chart";
import type { VelocityBucket } from "@/lib/metrics/portfolio-metrics";

describe("VelocityChart", () => {
  afterEach(cleanup);

  it("renders week labels", () => {
    const buckets: VelocityBucket[] = [
      { weekStart: "2026-04-01", label: "Apr 1 – Apr 7", count: 5 },
      { weekStart: "2026-04-08", label: "Apr 8 – Apr 14", count: 3 },
    ];
    render(<VelocityChart buckets={buckets} />);

    expect(screen.getByText("04-01")).toBeInTheDocument();
    expect(screen.getByText("04-08")).toBeInTheDocument();
  });

  it("renders count labels for non-zero buckets", () => {
    const buckets: VelocityBucket[] = [
      { weekStart: "2026-04-01", label: "Apr 1 – Apr 7", count: 5 },
      { weekStart: "2026-04-08", label: "Apr 8 – Apr 14", count: 0 },
    ];
    render(<VelocityChart buckets={buckets} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows empty message when all buckets are zero", () => {
    const buckets: VelocityBucket[] = [
      { weekStart: "2026-04-01", label: "Apr 1 – Apr 7", count: 0 },
      { weekStart: "2026-04-08", label: "Apr 8 – Apr 14", count: 0 },
    ];
    render(<VelocityChart buckets={buckets} />);

    expect(screen.getByText(/No completions/)).toBeInTheDocument();
  });
});
