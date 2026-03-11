import { describe, it } from "vitest";

describe("RoadmapBoard", () => {
  // RBRD-01: board with Ideas/Planned/Active/Done columns
  it.todo("renders four columns: Ideas, Planned, Active, Done");
  it.todo("groups items by status into correct columns");
  it.todo("renders empty columns with placeholder text");

  // RBRD-02: card shows name, description, category badge, deps
  it.todo("card displays feature name");
  it.todo("card displays description");
  it.todo("card displays category badge");
  it.todo("card displays dependency indicators");

  // RBRD-03: cards show started/completed dates
  it.todo("card shows started date when present");
  it.todo("card shows completed date when present");
  it.todo("card omits dates when not present");

  // RBRD-04: session link when referenced
  it.todo("card shows session link when sessionRefs has matching item ID");
  it.todo("card omits session link when no matching ref");
});
