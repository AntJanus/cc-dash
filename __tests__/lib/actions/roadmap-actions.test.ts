import { describe, it } from "vitest";

// Wave 0: Test stubs for roadmap CRUD server actions (RCRD-01 through RCRD-08)
// All stubs use it.todo() since production modules do not exist yet.

describe("addRoadmapItem", () => {
  it.todo("adds item to correct category");
  it.todo("generates unique r_ ID");
  it.todo("validates name is non-empty");
  it.todo("validates status against RoadmapStatus enum");
  it.todo("returns error for unknown category slug");
  it.todo("returns error for unknown project slug");
  it.todo("auto-sets started date when status is in-progress");
  it.todo("auto-sets completed date when status is done");
  it.todo("passes preserved content to writeRoadmapFile");
  it.todo("calls revalidatePath after write");
});

describe("updateRoadmapItem", () => {
  it.todo("updates item name");
  it.todo("updates item description");
  it.todo("updates item status");
  it.todo("auto-sets started on status change to in-progress");
  it.todo("auto-sets completed on status change to done");
  it.todo("moves item to different category when categorySlug provided");
  it.todo("returns error for unknown item ID");
  it.todo("preserves other fields during partial update");
});

describe("deleteRoadmapItem", () => {
  it.todo("removes item from category");
  it.todo("returns error for unknown item ID");
  it.todo("validates item ID format (r_ prefix)");
  it.todo("passes preserved content to writeRoadmapFile");
});

describe("reorderRoadmapItems", () => {
  it.todo("reorders items within category");
  it.todo("validates all IDs exist in category");
  it.todo("validates ID count matches item count");
  it.todo("returns error for unknown category");
});

describe("addRoadmapCategory", () => {
  it.todo("adds empty category");
  it.todo("generates slug from title");
  it.todo("rejects duplicate slug");
  it.todo("rejects empty title");
});

describe("deleteRoadmapCategory", () => {
  it.todo("removes category and its items");
  it.todo("returns error for unknown category slug");
  it.todo("passes preserved content");
});
