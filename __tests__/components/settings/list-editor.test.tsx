import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListEditor } from "@/components/settings/list-editor";

describe("ListEditor", () => {
  it("renders label and existing items", () => {
    render(
      <ListEditor
        label="Scan Directories"
        items={["/projects", "/work"]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Scan Directories")).toBeInTheDocument();
    expect(screen.getByText("/projects")).toBeInTheDocument();
    expect(screen.getByText("/work")).toBeInTheDocument();
  });

  it("adds item via input + Add button", () => {
    const onChange = vi.fn();
    render(
      <ListEditor
        label="Dirs"
        items={["/existing"]}
        onChange={onChange}
        placeholder="Add directory"
      />,
    );

    const input = screen.getByPlaceholderText("Add directory");
    fireEvent.change(input, { target: { value: "/new-dir" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith(["/existing", "/new-dir"]);
  });

  it("adds item via Enter key", () => {
    const onChange = vi.fn();
    render(
      <ListEditor
        label="Dirs"
        items={[]}
        onChange={onChange}
        placeholder="Add directory"
      />,
    );

    const input = screen.getByPlaceholderText("Add directory");
    fireEvent.change(input, { target: { value: "/enter-dir" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["/enter-dir"]);
  });

  it("removes item via X button", () => {
    const onChange = vi.fn();
    render(
      <ListEditor
        label="Dirs"
        items={["/a", "/b", "/c"]}
        onChange={onChange}
      />,
    );

    // Each item should have a remove button
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    expect(removeButtons).toHaveLength(3);

    // Remove second item
    fireEvent.click(removeButtons[1]);
    expect(onChange).toHaveBeenCalledWith(["/a", "/c"]);
  });

  it("does not add duplicate items", () => {
    const onChange = vi.fn();
    render(
      <ListEditor
        label="Dirs"
        items={["/existing"]}
        onChange={onChange}
        placeholder="Add"
      />,
    );

    const input = screen.getByPlaceholderText("Add");
    fireEvent.change(input, { target: { value: "/existing" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not add empty/whitespace items", () => {
    const onChange = vi.fn();
    render(
      <ListEditor
        label="Dirs"
        items={[]}
        onChange={onChange}
        placeholder="Add"
      />,
    );

    const input = screen.getByPlaceholderText("Add");

    // Empty
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onChange).not.toHaveBeenCalled();

    // Whitespace only
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange with updated array", () => {
    const onChange = vi.fn();
    render(
      <ListEditor
        label="Dirs"
        items={["/a"]}
        onChange={onChange}
        placeholder="Add"
      />,
    );

    const input = screen.getByPlaceholderText("Add");
    fireEvent.change(input, { target: { value: "/b" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith(["/a", "/b"]);
  });

  it("trims whitespace from new items", () => {
    const onChange = vi.fn();
    render(
      <ListEditor
        label="Dirs"
        items={[]}
        onChange={onChange}
        placeholder="Add"
      />,
    );

    const input = screen.getByPlaceholderText("Add");
    fireEvent.change(input, { target: { value: "  /trimmed  " } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith(["/trimmed"]);
  });
});
