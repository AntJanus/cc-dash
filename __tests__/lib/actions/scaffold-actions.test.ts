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

const {
  mockSlugify,
  mockDiscoverProjects,
  mockWriteRoadmapFile,
  mockWriteSessionFile,
  mockAtomicWriteFile,
  mockParseIdeas,
  mockWriteIdeasFile,
} = vi.hoisted(() => ({
  mockSlugify: vi.fn((s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
  ),
  mockDiscoverProjects: vi.fn(),
  mockWriteRoadmapFile: vi.fn(),
  mockWriteSessionFile: vi.fn(),
  mockAtomicWriteFile: vi.fn(),
  mockParseIdeas: vi.fn(),
  mockWriteIdeasFile: vi.fn(),
}));
vi.mock("@/lib/fs", () => ({
  slugify: mockSlugify,
  discoverProjects: mockDiscoverProjects,
  writeRoadmapFile: mockWriteRoadmapFile,
  writeSessionFile: mockWriteSessionFile,
  atomicWriteFile: mockAtomicWriteFile,
  parseIdeas: mockParseIdeas,
  writeIdeasFile: mockWriteIdeasFile,
}));

const { mockExpandTilde } = vi.hoisted(() => ({
  mockExpandTilde: vi.fn((p: string) => p.replace("~", "/home/user")),
}));
vi.mock("@/lib/fs/discovery", () => ({
  expandTilde: mockExpandTilde,
}));

const { mockMkdir, mockStat, mockReadFile } = vi.hoisted(() => ({
  mockMkdir: vi.fn(),
  mockStat: vi.fn(),
  mockReadFile: vi.fn(),
}));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: {
      ...actual,
      mkdir: mockMkdir,
      stat: mockStat,
      readFile: mockReadFile,
    },
    mkdir: mockMkdir,
    stat: mockStat,
    readFile: mockReadFile,
  };
});

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

const { mockGenerateRoadmapId } = vi.hoisted(() => ({
  mockGenerateRoadmapId: vi.fn(),
}));
vi.mock("@/lib/utils/generate-id", () => ({
  generateRoadmapId: mockGenerateRoadmapId,
}));

// Import AFTER mocks
import { createProjectFromIdea } from "@/lib/actions/scaffold-actions";
import type { CreateProjectInput } from "@/lib/actions/scaffold-actions";

// --- Helpers ---

function defaultInput(
  overrides: Partial<CreateProjectInput> = {},
): CreateProjectInput {
  return {
    ideaId: "i_abc12",
    projectName: "My Project",
    targetDir: "/home/user/projects",
    directoryName: "my-project",
    description: "A cool project",
    templateId: "blank",
    categories: [{ title: "Core Features", slug: "core" }],
    starterItems: [
      { name: "Setup", description: "Initial setup", categorySlug: "core" },
    ],
    stack: ["TypeScript"],
    createSession: false,
    ...overrides,
  };
}

function makeIdeasFile(): IdeasFile {
  return {
    schema: "cc-dash/ideas@1",
    last_updated: "2026-03-20T10:00:00.000Z",
    ideas: [
      {
        id: "i_abc12",
        status: "not-started",
        title: "My Project",
        body: "A cool project",
        stack: ["TypeScript"],
      },
    ],
    filePath: "/home/user/ideas/PROJECT_IDEAS.md",
  };
}

function setupHappyPath() {
  mockLoadConfig.mockResolvedValue({
    scan_dirs: ["/home/user/projects"],
    exclude_dirs: ["node_modules"],
    explicit_projects: [],
    scan_depth: 2,
    port: 3000,
    ideas_file: "/home/user/ideas/PROJECT_IDEAS.md",
  });
  // stat should throw (directory doesn't exist)
  mockStat.mockRejectedValue(new Error("ENOENT"));
  mockDiscoverProjects.mockResolvedValue([]);
  mockMkdir.mockResolvedValue(undefined);
  mockWriteRoadmapFile.mockResolvedValue({ success: true, data: undefined });
  mockWriteSessionFile.mockResolvedValue({ success: true, data: undefined });
  mockAtomicWriteFile.mockResolvedValue(undefined);
  mockGenerateRoadmapId.mockReturnValue("r_test1");

  // Ideas update mocks
  const ideasData = makeIdeasFile();
  mockReadFile.mockResolvedValue("mock raw");
  mockParseIdeas.mockReturnValue({
    success: true,
    data: ideasData,
    preserved: {} as IdeasParseResult,
  });
  mockWriteIdeasFile.mockResolvedValue({ success: true, data: undefined });
}

// --- Tests ---

describe("createProjectFromIdea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHappyPath();
  });

  it("creates directory and all files on happy path", async () => {
    const result = await createProjectFromIdea(defaultInput());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.slug).toBe("my-project");
    expect(result.data.projectPath).toBe("/home/user/projects/my-project");

    // mkdir called for project dir and .claude dir
    expect(mockMkdir).toHaveBeenCalledTimes(2);
    expect(mockMkdir).toHaveBeenCalledWith("/home/user/projects/my-project", {
      recursive: true,
    });
    expect(mockMkdir).toHaveBeenCalledWith(
      "/home/user/projects/my-project/.claude",
      { recursive: true },
    );

    // Roadmap written
    expect(mockWriteRoadmapFile).toHaveBeenCalledTimes(1);
    const [roadmapPath, roadmapData] = mockWriteRoadmapFile.mock.calls[0];
    expect(roadmapPath).toBe("/home/user/projects/my-project/ROADMAP.md");
    expect(roadmapData.schema).toBe("cc-dash/roadmap@1");
    expect(roadmapData.project).toBe("My Project");
    expect(roadmapData.description).toBe("A cool project");
    expect(roadmapData.categories).toHaveLength(1);
    expect(roadmapData.categories[0].title).toBe("Core Features");
    expect(roadmapData.categories[0].items).toHaveLength(1);
    expect(roadmapData.categories[0].items[0].name).toBe("Setup");
    expect(roadmapData.categories[0].items[0].status).toBe("planned");

    // Plain files written
    expect(mockAtomicWriteFile).toHaveBeenCalledTimes(3);

    // Session NOT written (createSession: false)
    expect(mockWriteSessionFile).not.toHaveBeenCalled();
  });

  it("creates SESSION_PROGRESS.md when createSession is true", async () => {
    const result = await createProjectFromIdea(
      defaultInput({ createSession: true }),
    );

    expect(result.success).toBe(true);
    expect(mockWriteSessionFile).toHaveBeenCalledTimes(1);
    const [sessionPath, sessionData] = mockWriteSessionFile.mock.calls[0];
    expect(sessionPath).toBe(
      "/home/user/projects/my-project/SESSION_PROGRESS.md",
    );
    expect(sessionData.schema).toBe("cc-dash/session@1");
    expect(sessionData.project).toBe("My Project");
    expect(sessionData.status).toBe("in-progress");
    expect(sessionData.session_id).toMatch(
      /^s_\d{4}-\d{2}-\d{2}_initial-setup$/,
    );
  });

  it("assigns unique IDs to starter items", async () => {
    let callCount = 0;
    mockGenerateRoadmapId.mockImplementation(() => `r_id${++callCount}`);

    const input = defaultInput({
      categories: [{ title: "Core", slug: "core" }],
      starterItems: [
        { name: "A", description: "Desc A", categorySlug: "core" },
        { name: "B", description: "Desc B", categorySlug: "core" },
      ],
    });

    const result = await createProjectFromIdea(input);
    expect(result.success).toBe(true);

    const roadmapData = mockWriteRoadmapFile.mock.calls[0][1];
    const items = roadmapData.categories[0].items;
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe("r_id1");
    expect(items[1].id).toBe("r_id2");
  });

  it("updates idea status to started with slug as path", async () => {
    await createProjectFromIdea(defaultInput());

    expect(mockWriteIdeasFile).toHaveBeenCalledTimes(1);
    const writtenData = mockWriteIdeasFile.mock.calls[0][1] as IdeasFile;
    const idea = writtenData.ideas.find((i) => i.id === "i_abc12");
    expect(idea?.status).toBe("started");
    expect(idea?.path).toBe("my-project");
  });

  it("returns error when project name is empty", async () => {
    const result = await createProjectFromIdea(
      defaultInput({ projectName: "" }),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors[0].field).toBe("projectName");
  });

  it("returns error when directory name is empty", async () => {
    const result = await createProjectFromIdea(
      defaultInput({ directoryName: "" }),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors[0].field).toBe("directoryName");
  });

  it("returns error when targetDir is not in scan_dirs", async () => {
    const result = await createProjectFromIdea(
      defaultInput({ targetDir: "/other/dir" }),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors[0].field).toBe("targetDir");
  });

  it("returns error when directory already exists", async () => {
    mockStat.mockResolvedValue({ isDirectory: () => true });

    const result = await createProjectFromIdea(defaultInput());

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors[0].field).toBe("directoryName");
    expect(result.errors[0].message).toContain("already exists");
  });

  it("returns error when slug conflicts with existing project", async () => {
    mockDiscoverProjects.mockResolvedValue([
      { slug: "my-project", name: "My Project", path: "/other/my-project" },
    ]);

    const result = await createProjectFromIdea(defaultInput());

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors[0].field).toBe("projectName");
    expect(result.errors[0].message).toContain("slug already exists");
  });

  it("succeeds even when ideas update fails", async () => {
    mockReadFile.mockRejectedValue(new Error("Ideas file not found"));

    const result = await createProjectFromIdea(defaultInput());

    // Project creation still succeeds
    expect(result.success).toBe(true);
  });

  it("revalidates paths on success", async () => {
    await createProjectFromIdea(defaultInput());

    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/ideas");
  });

  it("distributes starter items to correct categories", async () => {
    const input = defaultInput({
      categories: [
        { title: "Core", slug: "core" },
        { title: "Infra", slug: "infra" },
      ],
      starterItems: [
        { name: "Core A", description: "D", categorySlug: "core" },
        { name: "Infra A", description: "D", categorySlug: "infra" },
        { name: "Core B", description: "D", categorySlug: "core" },
      ],
    });

    await createProjectFromIdea(input);

    const roadmapData = mockWriteRoadmapFile.mock.calls[0][1];
    expect(roadmapData.categories[0].items).toHaveLength(2);
    expect(roadmapData.categories[1].items).toHaveLength(1);
  });
});
