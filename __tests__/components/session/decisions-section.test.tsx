import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { DecisionsSection } from "@/components/session/decisions-section";

describe("SESS-11: DecisionsSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders list of decisions", () => {
    const decisions = ["Use React for frontend", "Use Postgres for database"];
    render(<DecisionsSection decisions={decisions} />);
    expect(screen.getByText("Use React for frontend")).toBeInTheDocument();
    expect(screen.getByText("Use Postgres for database")).toBeInTheDocument();
  });

  it("renders empty state when no decisions", () => {
    render(<DecisionsSection decisions={[]} />);
    expect(screen.getByText("No decisions recorded")).toBeInTheDocument();
  });

  it("renders each decision as a list item", () => {
    const decisions = ["Decision A", "Decision B", "Decision C"];
    render(<DecisionsSection decisions={decisions} />);
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Decision A");
    expect(items[1]).toHaveTextContent("Decision B");
    expect(items[2]).toHaveTextContent("Decision C");
  });
});
