import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  ToolTracePanel,
  type ToolTraceEntry,
} from "@/components/ui/tool-trace";

const ENTRIES: ToolTraceEntry[] = [
  {
    id: "1",
    timestamp: "10:23:14",
    actor: "claude",
    action: "Read globals.css",
    state: "running",
  },
  {
    id: "2",
    timestamp: "10:23:18",
    actor: "claude",
    action: "Edit globals.css",
    output: "Replaced 3 declarations.",
    state: "draft",
  },
];

describe("ToolTracePanel", () => {
  afterEach(cleanup);

  it("renders the title and a log role with the title as label", () => {
    render(<ToolTracePanel entries={ENTRIES} />);
    expect(screen.getByText("Tool Trace")).toBeInTheDocument();
    expect(screen.getByRole("log", { name: "Tool Trace" })).toBeInTheDocument();
  });

  it("uses a custom title when provided", () => {
    render(<ToolTracePanel entries={ENTRIES} title="Agent Log" />);
    expect(screen.getByText("Agent Log")).toBeInTheDocument();
    expect(screen.getByRole("log", { name: "Agent Log" })).toBeInTheDocument();
  });

  it("renders one li per entry", () => {
    render(<ToolTracePanel entries={ENTRIES} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
  });

  it("renders timestamp, actor, and action for each entry", () => {
    render(<ToolTracePanel entries={ENTRIES} />);
    expect(screen.getByText("10:23:14")).toBeInTheDocument();
    expect(screen.getByText("10:23:18")).toBeInTheDocument();
    expect(screen.getAllByText("claude")).toHaveLength(2);
    expect(screen.getByText("Read globals.css")).toBeInTheDocument();
    expect(screen.getByText("Edit globals.css")).toBeInTheDocument();
  });

  it("renders output block only when entry.output is non-empty", () => {
    render(<ToolTracePanel entries={ENTRIES} />);
    expect(screen.getByText("Replaced 3 declarations.")).toBeInTheDocument();
    // First entry has no output
    const firstItem = screen.getAllByRole("listitem")[0]!;
    expect(firstItem.querySelector(".tool-trace-output")).toBeNull();
  });

  it("treats empty-string output as missing (no output block rendered)", () => {
    render(
      <ToolTracePanel
        entries={[
          { id: "x", timestamp: "00:00", actor: "a", action: "b", output: "" },
        ]}
      />,
    );
    expect(
      screen.queryByRole("listitem")?.querySelector(".tool-trace-output"),
    ).toBeNull();
  });

  it("renders a status dot for entries with state", () => {
    render(<ToolTracePanel entries={ENTRIES} />);
    expect(screen.getByLabelText("Running")).toBeInTheDocument();
    expect(screen.getByLabelText("Draft")).toBeInTheDocument();
  });

  it("renders a bullet placeholder when entry has no state", () => {
    render(
      <ToolTracePanel
        entries={[{ id: "x", timestamp: "00:00", actor: "a", action: "b" }]}
      />,
    );
    const item = screen.getByRole("listitem");
    expect(item.querySelector(".tool-trace-bullet")).not.toBeNull();
  });

  it("shows the empty message when entries is empty", () => {
    render(<ToolTracePanel entries={[]} />);
    expect(screen.getByText("No tool activity yet.")).toBeInTheDocument();
    expect(screen.queryByRole("log")).toBeNull();
  });

  it("uses a custom empty message when provided", () => {
    render(
      <ToolTracePanel
        entries={[]}
        emptyMessage="Nothing has happened — yet."
      />,
    );
    expect(screen.getByText("Nothing has happened — yet.")).toBeInTheDocument();
  });

  it("merges custom className on the root", () => {
    render(<ToolTracePanel entries={ENTRIES} className="extra-class" />);
    const root = screen
      .getByText("Tool Trace")
      .closest("[data-slot=tool-trace]");
    expect(root).toHaveClass("tool-trace");
    expect(root).toHaveClass("extra-class");
  });
});
