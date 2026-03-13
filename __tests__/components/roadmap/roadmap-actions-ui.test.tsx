import { describe, it } from "vitest";

// Wave 0: Test stubs for roadmap action UI components (RCRD-04, RCRD-05, RCRD-08)
// All stubs use it.todo() since production modules do not exist yet.

describe("ClickableRoadmapStatusBadge", () => {
  it.todo("shows current status");
  it.todo("opens dropdown on click");
  it.todo("calls onStatusChange with selected status");
  it.todo("shows all 4 roadmap statuses");
});

describe("ReorderButtons", () => {
  it.todo("renders up/down buttons");
  it.todo("calls onMoveUp when up clicked");
  it.todo("calls onMoveDown when down clicked");
  it.todo("disables up for first item");
  it.todo("disables down for last item");
});

describe("MoveCategorySelect", () => {
  it.todo("renders category options");
  it.todo("calls onMove with selected category");
  it.todo("excludes current category from options");
});
