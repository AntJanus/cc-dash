import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { QaNoteDialog } from "@/components/qa/qa-note-dialog";

describe("QaNoteDialog", () => {
  afterEach(() => cleanup());

  it("does not render when open is false", () => {
    render(
      <QaNoteDialog
        open={false}
        title="X"
        description="Y"
        submitLabel="Submit"
        onSubmit={async () => null}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title and description when open", () => {
    render(
      <QaNoteDialog
        open
        title="Fail this QA item"
        description="Add a note explaining what went wrong."
        submitLabel="Fail and file issue"
        onSubmit={async () => null}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Fail this QA item")).toBeInTheDocument();
    expect(
      screen.getByText("Add a note explaining what went wrong."),
    ).toBeInTheDocument();
  });

  it("disables submit until a non-empty note is typed", () => {
    render(
      <QaNoteDialog
        open
        title="X"
        description="Y"
        submitLabel="Submit"
        onSubmit={async () => null}
        onClose={() => {}}
      />,
    );
    const submit = screen.getByRole("button", { name: "Submit" });
    expect(submit).toBeDisabled();

    const textarea = screen.getByLabelText("Note");
    fireEvent.change(textarea, { target: { value: "real note" } });
    expect(submit).not.toBeDisabled();
  });

  it("calls onSubmit with the trimmed note and closes on success", async () => {
    const onSubmit = vi.fn(async () => null);
    const onClose = vi.fn();
    render(
      <QaNoteDialog
        open
        title="X"
        description="Y"
        submitLabel="Submit"
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "  trimmed  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await new Promise((r) => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledWith("trimmed");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the error message and stays open when onSubmit returns an error", async () => {
    const onSubmit = vi.fn(async () => "Something went wrong");
    const onClose = vi.fn();
    render(
      <QaNoteDialog
        open
        title="X"
        description="Y"
        submitLabel="Submit"
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "note" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Cancel triggers onClose without calling onSubmit", () => {
    const onSubmit = vi.fn(async () => null);
    const onClose = vi.fn();
    render(
      <QaNoteDialog
        open
        title="X"
        description="Y"
        submitLabel="Submit"
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
