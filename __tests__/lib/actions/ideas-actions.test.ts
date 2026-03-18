import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IdeasFile } from "@/lib/schemas/ideas";
import type { IdeasParseResult } from "@/lib/fs/types";

// --- Mocks must be set up before importing the module under test ---

const { mockLoadConfig } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
}));

const { mockParseIdeas, mockWriteIdeasFile } = vi.hoisted(() => ({
  mockParseIdeas: vi.fn(),
  mockWriteIdeasFile: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  parseIdeas: mockParseIdeas,
  writeIdeasFile: mockWriteIdeasFile,
}));

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile },
    readFile: mockReadFile,
  };
});

const { mockExpandTilde } = vi.hoisted(() => ({
  mockExpandTilde: vi.fn(),
}));
vi.mock("@/lib/fs/discovery", () => ({
  expandTilde: mockExpandTilde,
}));

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

const { mockGenerateIdeaId } = vi.hoisted(() => ({
  mockGenerateIdeaId: vi.fn(),
}));
vi.mock("@/lib/utils/generate-id", () => ({
  generateIdeaId: mockGenerateIdeaId,
}));

// Import AFTER mocks
import {
  addIdea,
  updateIdeaMetadata,
  updateIdeaBody,
  deleteIdea,
} from "@/lib/actions/ideas-actions";

// --- Helpers ---

function makeIdeas(overrides: Partial<IdeasFile> = {}): IdeasFile {
  return {
    schema: "cc-dash/ideas@1",
    last_updated: "2026-03-17T10:00:00.000Z",
    ideas: [
      {
        id: "i_abc12",
        status: "not-started",
        title: "Idea A",
        body: "Description of idea A",
        stack: ["TypeScript", "React"],
      },
      {
        id: "i_def34",
        status: "started",
        path: "project-b",
        title: "Idea B",
        body: "Description of idea B",
      },
    ],
    filePath: "/path/to/PROJECT_IDEAS.md",
    ...overrides,
  };
}

function makePreserved(
  overrides: Partial<IdeasParseResult> = {},
): IdeasParseResult {
  return {
    preamble: "# Project Ideas",
    trailingContent: "",
    ...overrides,
  };
}

function setupMocks(ideas?: IdeasFile, preserved?: IdeasParseResult) {
  const ideasData = ideas ?? makeIdeas();
  const pres = preserved ?? makePreserved();
  mockLoadConfig.mockResolvedValue({
    scan_dirs: [],
    explicit_projects: [],
    exclude_dirs: [],
    scan_depth: 2,
    ideas_file: "~/PROJECT_IDEAS.md",
  });
  mockExpandTilde.mockReturnValue("/path/to/PROJECT_IDEAS.md");
  mockReadFile.mockResolvedValue("raw-ideas");
  mockParseIdeas.mockReturnValue({
    success: true,
    data: ideasData,
    preserved: pres,
  });
  mockWriteIdeasFile.mockResolvedValue({
    success: true,
    data: undefined,
  });
  mockGenerateIdeaId.mockReturnValue("i_new01");
  return { ideas: ideasData, preserved: pres };
}

// --- Tests ---

describe("addIdea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates idea with generated i_ ID", async () => {
    setupMocks();

    const result = await addIdea({
      title: "New Idea",
      status: "not-started",
      stack: ["Go"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("i_new01");
    }
  });

  it("rejects if ideas_file not configured", async () => {
    mockLoadConfig.mockResolvedValue({
      scan_dirs: [],
      explicit_projects: [],
      exclude_dirs: [],
      scan_depth: 2,
    });

    const result = await addIdea({
      title: "New Idea",
      status: "not-started",
      stack: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("ideas_file");
    }
  });

  it("appends new idea to end of ideas array", async () => {
    setupMocks();

    await addIdea({
      title: "New Idea",
      status: "not-started",
      stack: ["Go"],
    });

    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    expect(writtenData.ideas).toHaveLength(3);
    expect(writtenData.ideas[2].id).toBe("i_new01");
    expect(writtenData.ideas[2].title).toBe("New Idea");
    expect(writtenData.ideas[2].body).toBe("");
    expect(writtenData.ideas[2].stack).toEqual(["Go"]);
  });

  it("omits stack when empty array provided", async () => {
    setupMocks();

    await addIdea({
      title: "New Idea",
      status: "not-started",
      stack: [],
    });

    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    const newIdea = writtenData.ideas[writtenData.ideas.length - 1];
    expect(newIdea.stack).toBeUndefined();
  });

  it("revalidates /ideas path after success", async () => {
    setupMocks();

    await addIdea({
      title: "New Idea",
      status: "not-started",
      stack: [],
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/ideas");
  });

  it("passes preserved content to writeIdeasFile", async () => {
    const { preserved } = setupMocks();

    await addIdea({
      title: "New Idea",
      status: "not-started",
      stack: [],
    });

    const [, , preservedArg] = mockWriteIdeasFile.mock.calls[0];
    expect(preservedArg).toEqual(preserved);
  });

  it("stores body when provided", async () => {
    setupMocks();

    await addIdea({
      title: "New Idea",
      status: "not-started",
      stack: [],
      body: "This is the idea body content.",
    });

    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    const newIdea = writtenData.ideas[writtenData.ideas.length - 1];
    expect(newIdea.body).toBe("This is the idea body content.");
  });

  it("defaults body to empty string when not provided", async () => {
    setupMocks();

    await addIdea({
      title: "New Idea",
      status: "not-started",
      stack: [],
    });

    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    const newIdea = writtenData.ideas[writtenData.ideas.length - 1];
    expect(newIdea.body).toBe("");
  });
});

describe("updateIdeaMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates status of existing idea by ID", async () => {
    setupMocks();

    const result = await updateIdeaMetadata({
      id: "i_abc12",
      status: "started",
      path: "my-project",
      stack: ["TypeScript"],
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    const idea = writtenData.ideas.find(
      (i: { id: string }) => i.id === "i_abc12",
    );
    expect(idea.status).toBe("started");
  });

  it("updates path and stack fields", async () => {
    setupMocks();

    await updateIdeaMetadata({
      id: "i_abc12",
      status: "started",
      path: "new-project-path",
      stack: ["Rust", "WASM"],
    });

    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    const idea = writtenData.ideas.find(
      (i: { id: string }) => i.id === "i_abc12",
    );
    expect(idea.path).toBe("new-project-path");
    expect(idea.stack).toEqual(["Rust", "WASM"]);
  });

  it("rejects promoting to started without path", async () => {
    const ideas = makeIdeas();
    // Ensure idea has no path
    ideas.ideas[0].path = undefined;
    setupMocks(ideas);

    const result = await updateIdeaMetadata({
      id: "i_abc12",
      status: "started",
      stack: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("path");
    }
  });

  it("allows started if idea already has a path", async () => {
    const ideas = makeIdeas();
    ideas.ideas[0].path = "existing-project";
    setupMocks(ideas);

    const result = await updateIdeaMetadata({
      id: "i_abc12",
      status: "started",
      stack: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects if idea ID not found", async () => {
    setupMocks();

    const result = await updateIdeaMetadata({
      id: "i_zzzzz",
      status: "not-started",
      stack: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("id");
    }
  });

  it("revalidates /ideas path after success", async () => {
    setupMocks();

    await updateIdeaMetadata({
      id: "i_abc12",
      status: "not-started",
      stack: ["TypeScript"],
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/ideas");
  });
});

describe("updateIdeaBody", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces body content for existing idea by ID", async () => {
    setupMocks();

    const result = await updateIdeaBody({
      id: "i_abc12",
      body: "Updated body content",
    });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    const idea = writtenData.ideas.find(
      (i: { id: string }) => i.id === "i_abc12",
    );
    expect(idea.body).toBe("Updated body content");
  });

  it("preserves all other fields when updating body", async () => {
    setupMocks();

    await updateIdeaBody({
      id: "i_abc12",
      body: "Updated body content",
    });

    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    const idea = writtenData.ideas.find(
      (i: { id: string }) => i.id === "i_abc12",
    );
    expect(idea.title).toBe("Idea A");
    expect(idea.status).toBe("not-started");
    expect(idea.stack).toEqual(["TypeScript", "React"]);
    expect(idea.id).toBe("i_abc12");
  });

  it("rejects if idea ID not found", async () => {
    setupMocks();

    const result = await updateIdeaBody({
      id: "i_zzzzz",
      body: "New body",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("id");
    }
  });
});

describe("deleteIdea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes idea by ID from array", async () => {
    setupMocks();

    const result = await deleteIdea({ id: "i_abc12" });

    expect(result.success).toBe(true);
    const [, writtenData] = mockWriteIdeasFile.mock.calls[0];
    expect(writtenData.ideas).toHaveLength(1);
    expect(
      writtenData.ideas.find((i: { id: string }) => i.id === "i_abc12"),
    ).toBeUndefined();
  });

  it("rejects if idea ID not found", async () => {
    setupMocks();

    const result = await deleteIdea({ id: "i_zzzzz" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("id");
    }
  });

  it("revalidates /ideas path after success", async () => {
    setupMocks();

    await deleteIdea({ id: "i_abc12" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/ideas");
  });

  it("passes preserved content to writeIdeasFile", async () => {
    const { preserved } = setupMocks();

    await deleteIdea({ id: "i_abc12" });

    const [, , preservedArg] = mockWriteIdeasFile.mock.calls[0];
    expect(preservedArg).toEqual(preserved);
  });
});
