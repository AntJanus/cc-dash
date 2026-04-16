import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ProgressDistribution } from "@/components/metrics/progress-distribution";
import type { ProgressBucket } from "@/lib/metrics/portfolio-metrics";

describe("ProgressDistribution", () => {
  afterEach(cleanup);

  const buckets: ProgressBucket[] = [
    { label: "0–25%", min: 0, max: 25, count: 10, projects: [] },
    { label: "25–50%", min: 25, max: 50, count: 5, projects: [] },
    { label: "50–75%", min: 50, max: 75, count: 2, projects: [] },
    { label: "75–99%", min: 75, max: 100, count: 1, projects: [] },
    { label: "100%", min: 100, max: 101, count: 3, projects: [] },
  ];

  it("renders all bucket labels", () => {
    render(<ProgressDistribution buckets={buckets} totalProjects={21} />);

    expect(screen.getByText("0–25%")).toBeInTheDocument();
    expect(screen.getByText("25–50%")).toBeInTheDocument();
    expect(screen.getByText("50–75%")).toBeInTheDocument();
    expect(screen.getByText("75–99%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders counts inside bars for non-zero buckets", () => {
    render(<ProgressDistribution buckets={buckets} totalProjects={21} />);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
