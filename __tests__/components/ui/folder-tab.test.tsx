import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { FolderTab, FolderTabs } from "@/components/ui/folder-tab";

describe("FolderTab", () => {
  afterEach(cleanup);

  it("renders as a button with role=tab and the folder-tab class", () => {
    render(<FolderTab>Roadmap</FolderTab>);
    const tab = screen.getByRole("tab", { name: "Roadmap" });
    expect(tab.tagName).toBe("BUTTON");
    expect(tab).toHaveClass("folder-tab");
  });

  it("defaults aria-selected and data-active to false when not active", () => {
    render(<FolderTab>Roadmap</FolderTab>);
    const tab = screen.getByRole("tab", { name: "Roadmap" });
    expect(tab).toHaveAttribute("aria-selected", "false");
    expect(tab).toHaveAttribute("data-active", "false");
    expect(tab).not.toHaveClass("folder-tab-active");
  });

  it("applies active state when active=true", () => {
    render(<FolderTab active>Active</FolderTab>);
    const tab = screen.getByRole("tab", { name: "Active" });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveAttribute("data-active", "true");
    expect(tab).toHaveClass("folder-tab-active");
  });

  it("forwards onClick and other button props", () => {
    let clicked = 0;
    render(<FolderTab onClick={() => clicked++}>Click</FolderTab>);
    const tab = screen.getByRole("tab", { name: "Click" });
    tab.click();
    tab.click();
    expect(clicked).toBe(2);
  });

  it("merges custom className", () => {
    render(<FolderTab className="extra">Tab</FolderTab>);
    const tab = screen.getByRole("tab", { name: "Tab" });
    expect(tab).toHaveClass("folder-tab");
    expect(tab).toHaveClass("extra");
  });

  it("uses type=button by default to avoid form submits", () => {
    render(<FolderTab>Tab</FolderTab>);
    const tab = screen.getByRole("tab", { name: "Tab" });
    expect(tab).toHaveAttribute("type", "button");
  });
});

describe("FolderTabs", () => {
  afterEach(cleanup);

  it("renders a tablist with the folder-tabs class", () => {
    render(
      <FolderTabs>
        <FolderTab>One</FolderTab>
        <FolderTab>Two</FolderTab>
      </FolderTabs>,
    );
    const list = screen.getByRole("tablist");
    expect(list).toHaveClass("folder-tabs");
    expect(list).toHaveAttribute("data-variant", "attached");
    expect(list).not.toHaveClass("folder-tabs-detached");
  });

  it("applies the detached variant class when variant=detached", () => {
    render(
      <FolderTabs variant="detached">
        <FolderTab>Solo</FolderTab>
      </FolderTabs>,
    );
    const list = screen.getByRole("tablist");
    expect(list).toHaveAttribute("data-variant", "detached");
    expect(list).toHaveClass("folder-tabs-detached");
  });
});
