import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";
import type { RoadmapParseResult, SessionParseResult } from "@/lib/fs/types";

// --- Mocks (must be hoisted before import) ---

const {
  mockLoadConfig,
  mockDiscoverProjects,
  mockParseRoadmap,
  mockParseSession,
  mockParseIdeas,
  mockWriteRoadmapFile,
  mockWriteSessionFile,
  mockReadFile,
  mockExpandTilde,
  mockGenerateRoadmapId,
  mockGenerateCategorySlug,
  mockLoadPortfolio,
  mockSavePortfolio,
  mockLoadAllPortfolios,
  mockCONFIG_PATH,
} = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
  mockDiscoverProjects: vi.fn(),
  mockParseRoadmap: vi.fn(),
  mockParseSession: vi.fn(),
  mockParseIdeas: vi.fn(),
  mockWriteRoadmapFile: vi.fn(),
  mockWriteSessionFile: vi.fn(),
  mockReadFile: vi.fn(),
  mockExpandTilde: vi.fn(),
  mockGenerateRoadmapId: vi.fn(),
  mockGenerateCategorySlug: vi.fn(),
  mockLoadPortfolio: vi.fn(),
  mockSavePortfolio: vi.fn(),
  mockLoadAllPortfolios: vi.fn(),
  mockCONFIG_PATH: "/home/user/.config/cc-dash/config.json",
}));

vi.mock("@/lib/config", () => ({
  loadConfig: mockLoadConfig,
  CONFIG_PATH: mockCONFIG_PATH,
}));

vi.mock("@/lib/fs", () => ({
  discoverProjects: mockDiscoverProjects,
  parseRoadmap: mockParseRoadmap,
  parseSession: mockParseSession,
  parseIdeas: mockParseIdeas,
  writeRoadmapFile: mockWriteRoadmapFile,
  writeSessionFile: mockWriteSessionFile,
}));

vi.mock("@/lib/fs/discovery", () => ({
  expandTilde: mockExpandTilde,
}));

vi.mock("@/lib/fs/portfolio", () => ({
  loadPortfolio: mockLoadPortfolio,
  savePortfolio: mockSavePortfolio,
  loadAllPortfolios: mockLoadAllPortfolios,
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: { ...actual, readFile: mockReadFile },
    readFile: mockReadFile,
  };
});

vi.mock("@/lib/utils/generate-id", () => ({
  generateRoadmapId: mockGenerateRoadmapId,
  generateCategorySlug: mockGenerateCategorySlug,
}));

// Import AFTER mocks
import { createServer } from "@/mcp/create-server";

// --- Test helpers ---

const defaultConfig = {
  scan_dirs: ["/projects"],
  explicit_projects: [],
  exclude_dirs: ["node_modules", ".git"],
  scan_depth: 2,
};

function makeRoadmap(overrides: Partial<RoadmapFile> = {}): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "A test roadmap",
    last_updated: "2026-03-01T10:00:00-07:00",
    categories: [
      {
        title: "Core Features",
        slug: "core-features",
        items: [
          {
            id: "r_abc12",
            status: "planned",
            name: "Feature A",
            description: "First feature",
          },
          {
            id: "r_def34",
            status: "in-progress",
            name: "Feature B",
            description: "Second feature",
            started: "2026-03-01",
          },
        ],
      },
      {
        title: "Nice to Have",
        slug: "nice-to-have",
        items: [
          {
            id: "r_ghi56",
            status: "done",
            name: "Feature C",
            description: "Third feature",
            completed: "2026-03-05",
          },
        ],
      },
    ],
    filePath: "/projects/test-project/ROADMAP.md",
    ...overrides,
  };
}

function makePreserved(): RoadmapParseResult {
  return { preamble: "# Roadmap", unknownSections: [], trailingContent: "" };
}

function makeSession(overrides: Partial<SessionFile> = {}): SessionFile {
  return {
    schema: "cc-dash/session@1",
    project: "test-project",
    session_id: "s_2026-03-10_auth",
    started: "2026-03-10T09:00:00-07:00",
    last_updated: "2026-03-10T14:00:00-07:00",
    status: "in-progress",
    currentStatus: "Working on auth",
    tasks: [
      {
        id: "t_aaa11",
        checked: false,
        description: "Set up OAuth",
        dependency: "none",
      },
      {
        id: "t_bbb22",
        checked: true,
        description: "Add login page",
        dependency: "t_aaa11",
      },
    ],
    decisions: ["Use Passport.js"],
    failedAttempts: [],
    completedWork: [],
    filePath: "/projects/test-project/SESSION_PROGRESS.md",
    ...overrides,
  };
}

function makeSessionPreserved(): SessionParseResult {
  return {
    preamble: "# Session Progress",
    unknownSections: [],
    trailingContent: "",
  };
}

const defaultProjects = [
  {
    name: "Test Project",
    slug: "test-project",
    path: "/projects/test-project",
    roadmapPath: "/projects/test-project/ROADMAP.md",
    sessionPath: "/projects/test-project/SESSION_PROGRESS.md",
    isExplicit: false,
  },
];

function setupDefaultMocks() {
  mockLoadConfig.mockResolvedValue(defaultConfig);
  mockDiscoverProjects.mockResolvedValue(defaultProjects);
  mockReadFile.mockResolvedValue("raw-file-content");
  mockExpandTilde.mockImplementation((p: string) => p);
  mockParseRoadmap.mockReturnValue({
    success: true,
    data: makeRoadmap(),
    preserved: makePreserved(),
  });
  mockParseSession.mockReturnValue({
    success: true,
    data: makeSession(),
    preserved: makeSessionPreserved(),
  });
  mockWriteRoadmapFile.mockResolvedValue({ success: true, data: undefined });
  mockWriteSessionFile.mockResolvedValue({ success: true, data: undefined });
  mockGenerateRoadmapId.mockReturnValue("r_new01");
  mockGenerateCategorySlug.mockImplementation((title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  );
  mockLoadPortfolio.mockResolvedValue({
    schema: "cc-dash/portfolio@1",
    projects: {},
  });
  mockSavePortfolio.mockResolvedValue(undefined);
  mockLoadAllPortfolios.mockResolvedValue(new Map());
}

// --- Client/server lifecycle helpers ---

let client: Client;
let cleanup: () => Promise<void>;

async function connectClient() {
  const server = createServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);

  cleanup = async () => {
    await client.close();
    await server.close();
  };
}

/** Call a tool and return parsed JSON from the text content. */
async function callTool(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as { type: string; text: string }[])[0]?.text;
  return {
    text,
    isError: result.isError,
    json: text ? JSON.parse(text) : null,
  };
}

/** Call a tool expecting plain text (not JSON). */
async function callToolText(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as { type: string; text: string }[])[0]?.text;
  return { text, isError: result.isError };
}

// --- Tests ---

describe("MCP Server", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setupDefaultMocks();
    await connectClient();
  });

  afterEach(async () => {
    await cleanup();
  });

  // -----------------------------------------------------------------------
  // Tool listing
  // -----------------------------------------------------------------------

  describe("tools/list", () => {
    it("registers all 14 tools", async () => {
      const result = await client.listTools();
      const names = result.tools.map((t) => t.name).sort();
      expect(names).toEqual([
        "add_roadmap_category",
        "add_roadmap_item",
        "bulk_update_status",
        "get_config",
        "get_portfolio",
        "get_project",
        "get_session",
        "list_ideas",
        "list_projects",
        "reorder_projects",
        "search",
        "set_project_status",
        "update_roadmap_item",
        "update_session_status",
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // list_projects
  // -----------------------------------------------------------------------

  describe("list_projects", () => {
    it("returns project summaries with roadmap stats", async () => {
      const { json } = await callTool("list_projects");
      expect(json).toHaveLength(1);
      expect(json[0].slug).toBe("test-project");
      expect(json[0].hasRoadmap).toBe(true);
      expect(json[0].hasSession).toBe(true);
      expect(json[0].roadmapTotal).toBe(3);
      expect(json[0].roadmapDone).toBe(1);
      expect(json[0].roadmapInProgress).toBe(1);
    });

    it("includes session stats", async () => {
      const { json } = await callTool("list_projects");
      expect(json[0].sessionStatus).toBe("in-progress");
      expect(json[0].sessionId).toBe("s_2026-03-10_auth");
      expect(json[0].tasksTotal).toBe(2);
      expect(json[0].tasksDone).toBe(1);
    });

    it("handles projects without roadmap or session", async () => {
      mockDiscoverProjects.mockResolvedValue([
        {
          name: "Bare Project",
          slug: "bare",
          path: "/projects/bare",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: false,
        },
      ]);

      const { json } = await callTool("list_projects");
      expect(json[0].hasRoadmap).toBe(false);
      expect(json[0].hasSession).toBe(false);
      expect(json[0].roadmapTotal).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // get_project
  // -----------------------------------------------------------------------

  describe("get_project", () => {
    it("returns full roadmap and session detail", async () => {
      const { json } = await callTool("get_project", { slug: "test-project" });
      expect(json.slug).toBe("test-project");
      expect(json.roadmap.categories).toHaveLength(2);
      expect(json.roadmap.categories[0].items).toHaveLength(2);
      expect(json.session.sessionId).toBe("s_2026-03-10_auth");
      expect(json.session.tasks).toHaveLength(2);
    });

    it("returns error for unknown project", async () => {
      const { text, isError } = await callToolText("get_project", {
        slug: "nonexistent",
      });
      expect(isError).toBe(true);
      expect(text).toContain("not found");
    });

    it("includes session decisions and failed attempts", async () => {
      const { json } = await callTool("get_project", { slug: "test-project" });
      expect(json.session.decisions).toEqual(["Use Passport.js"]);
      expect(json.session.failedAttempts).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // search
  // -----------------------------------------------------------------------

  describe("search", () => {
    it("finds roadmap items by name", async () => {
      const { json } = await callTool("search", { query: "Feature A" });
      expect(json.resultCount).toBe(1);
      expect(json.results[0].type).toBe("roadmap");
      expect(json.results[0].name).toBe("Feature A");
    });

    it("finds session tasks by description", async () => {
      const { json } = await callTool("search", { query: "OAuth" });
      expect(
        json.results.some((r: { type: string }) => r.type === "session"),
      ).toBe(true);
    });

    it("is case-insensitive", async () => {
      const { json } = await callTool("search", { query: "feature a" });
      expect(json.resultCount).toBe(1);
    });

    it("returns error for empty query", async () => {
      const { isError, text } = await callToolText("search", { query: "   " });
      expect(isError).toBe(true);
      expect(text).toContain("Empty query");
    });

    it("searches ideas when ideas_file is configured", async () => {
      mockLoadConfig.mockResolvedValue({
        ...defaultConfig,
        ideas_file: "~/PROJECT_IDEAS.md",
      });
      mockExpandTilde.mockReturnValue("/home/user/PROJECT_IDEAS.md");
      mockParseIdeas.mockReturnValue({
        success: true,
        data: {
          ideas: [
            {
              id: "i_abc12",
              title: "AI Dashboard",
              status: "not-started",
              body: "Build an AI-powered dashboard",
            },
          ],
        },
      });

      const { json } = await callTool("search", { query: "AI Dashboard" });
      expect(
        json.results.some((r: { type: string }) => r.type === "idea"),
      ).toBe(true);
    });

    it("returns no results for non-matching query", async () => {
      const { json } = await callTool("search", { query: "zzz_no_match_zzz" });
      expect(json.resultCount).toBe(0);
      expect(json.results).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // update_roadmap_item
  // -----------------------------------------------------------------------

  describe("update_roadmap_item", () => {
    it("updates item name and description", async () => {
      const { text, isError } = await callToolText("update_roadmap_item", {
        slug: "test-project",
        itemId: "r_abc12",
        name: "Renamed Feature",
        description: "New desc",
      });
      expect(isError).toBeFalsy();
      expect(text).toContain("Updated item r_abc12");
      expect(mockWriteRoadmapFile).toHaveBeenCalledOnce();
    });

    it("auto-sets started date when transitioning to in-progress", async () => {
      const { isError } = await callToolText("update_roadmap_item", {
        slug: "test-project",
        itemId: "r_abc12",
        status: "in-progress",
      });
      expect(isError).toBeFalsy();

      const writtenData = mockWriteRoadmapFile.mock.calls[0][1];
      const item = writtenData.categories[0].items.find(
        (i: { id: string }) => i.id === "r_abc12",
      );
      expect(item.status).toBe("in-progress");
      expect(item.started).toBeDefined();
    });

    it("auto-sets completed date when transitioning to done", async () => {
      await callToolText("update_roadmap_item", {
        slug: "test-project",
        itemId: "r_abc12",
        status: "done",
      });

      const writtenData = mockWriteRoadmapFile.mock.calls[0][1];
      const item = writtenData.categories[0].items.find(
        (i: { id: string }) => i.id === "r_abc12",
      );
      expect(item.completed).toBeDefined();
    });

    it("moves item between categories", async () => {
      const { isError } = await callToolText("update_roadmap_item", {
        slug: "test-project",
        itemId: "r_abc12",
        categorySlug: "nice-to-have",
      });
      expect(isError).toBeFalsy();

      const writtenData = mockWriteRoadmapFile.mock.calls[0][1];
      const source = writtenData.categories.find(
        (c: { slug: string }) => c.slug === "core-features",
      );
      const target = writtenData.categories.find(
        (c: { slug: string }) => c.slug === "nice-to-have",
      );
      expect(source.items.some((i: { id: string }) => i.id === "r_abc12")).toBe(
        false,
      );
      expect(target.items.some((i: { id: string }) => i.id === "r_abc12")).toBe(
        true,
      );
    });

    it("returns error for unknown project", async () => {
      const { isError } = await callToolText("update_roadmap_item", {
        slug: "nonexistent",
        itemId: "r_abc12",
      });
      expect(isError).toBe(true);
    });

    it("returns error for unknown item", async () => {
      const { isError, text } = await callToolText("update_roadmap_item", {
        slug: "test-project",
        itemId: "r_zzzzz",
      });
      expect(isError).toBe(true);
      expect(text).toContain("not found");
    });

    it("returns error for unknown target category", async () => {
      const { isError, text } = await callToolText("update_roadmap_item", {
        slug: "test-project",
        itemId: "r_abc12",
        categorySlug: "nonexistent",
      });
      expect(isError).toBe(true);
      expect(text).toContain("not found");
    });
  });

  // -----------------------------------------------------------------------
  // add_roadmap_item
  // -----------------------------------------------------------------------

  describe("add_roadmap_item", () => {
    it("adds item to specified category", async () => {
      const { text, isError } = await callToolText("add_roadmap_item", {
        slug: "test-project",
        categorySlug: "core-features",
        name: "New Feature",
        description: "A brand new feature",
      });
      expect(isError).toBeFalsy();
      expect(text).toContain("r_new01");
      expect(text).toContain("core-features");
      expect(mockWriteRoadmapFile).toHaveBeenCalledOnce();
    });

    it("defaults status to planned", async () => {
      await callToolText("add_roadmap_item", {
        slug: "test-project",
        categorySlug: "core-features",
        name: "New Feature",
        description: "A feature",
      });

      const writtenData = mockWriteRoadmapFile.mock.calls[0][1];
      const core = writtenData.categories.find(
        (c: { slug: string }) => c.slug === "core-features",
      );
      const newItem = core.items.find(
        (i: { id: string }) => i.id === "r_new01",
      );
      expect(newItem.status).toBe("planned");
    });

    it("returns error for unknown category", async () => {
      const { isError, text } = await callToolText("add_roadmap_item", {
        slug: "test-project",
        categorySlug: "nonexistent",
        name: "Item",
        description: "Desc",
      });
      expect(isError).toBe(true);
      expect(text).toContain("not found");
    });

    it("returns error for unknown project", async () => {
      const { isError } = await callToolText("add_roadmap_item", {
        slug: "nonexistent",
        categorySlug: "core-features",
        name: "Item",
        description: "Desc",
      });
      expect(isError).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // add_roadmap_category
  // -----------------------------------------------------------------------

  describe("add_roadmap_category", () => {
    it("creates a new category", async () => {
      const { text, isError } = await callToolText("add_roadmap_category", {
        slug: "test-project",
        title: "Experimental",
      });
      expect(isError).toBeFalsy();
      expect(text).toContain("experimental");
      expect(mockWriteRoadmapFile).toHaveBeenCalledOnce();
    });

    it("rejects duplicate category slug", async () => {
      const { isError, text } = await callToolText("add_roadmap_category", {
        slug: "test-project",
        title: "Core Features",
      });
      expect(isError).toBe(true);
      expect(text).toContain("already exists");
    });
  });

  // -----------------------------------------------------------------------
  // bulk_update_status
  // -----------------------------------------------------------------------

  describe("bulk_update_status", () => {
    it("updates multiple items at once", async () => {
      const { text, isError } = await callToolText("bulk_update_status", {
        slug: "test-project",
        itemIds: ["r_abc12", "r_ghi56"],
        status: "done",
      });
      expect(isError).toBeFalsy();
      expect(text).toContain("2 items");
    });

    it("returns error when no items match", async () => {
      const { isError } = await callToolText("bulk_update_status", {
        slug: "test-project",
        itemIds: ["r_zzzzz"],
        status: "done",
      });
      expect(isError).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // get_session
  // -----------------------------------------------------------------------

  describe("get_session", () => {
    it("returns session state with tasks", async () => {
      const { json, isError } = await callTool("get_session", {
        slug: "test-project",
      });
      expect(isError).toBeFalsy();
      expect(json.sessionId).toBe("s_2026-03-10_auth");
      expect(json.status).toBe("in-progress");
      expect(json.tasks).toHaveLength(2);
      expect(json.tasks[0].id).toBe("t_aaa11");
      expect(json.tasks[1].checked).toBe(true);
    });

    it("returns error for project without session", async () => {
      mockDiscoverProjects.mockResolvedValue([
        {
          name: "No Session",
          slug: "no-session",
          path: "/projects/no-session",
          roadmapPath: "/projects/no-session/ROADMAP.md",
          sessionPath: null,
          isExplicit: false,
        },
      ]);

      const { isError, text } = await callToolText("get_session", {
        slug: "no-session",
      });
      expect(isError).toBe(true);
      expect(text).toContain("no session file");
    });
  });

  // -----------------------------------------------------------------------
  // update_session_status
  // -----------------------------------------------------------------------

  describe("update_session_status", () => {
    it("updates session lifecycle status", async () => {
      const { text, isError } = await callToolText("update_session_status", {
        slug: "test-project",
        status: "paused",
      });
      expect(isError).toBeFalsy();
      expect(text).toContain("paused");
      expect(mockWriteSessionFile).toHaveBeenCalledOnce();

      const writtenData = mockWriteSessionFile.mock.calls[0][1];
      expect(writtenData.status).toBe("paused");
    });

    it("returns error for project without session", async () => {
      mockDiscoverProjects.mockResolvedValue([
        {
          name: "Bare",
          slug: "bare",
          path: "/projects/bare",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: false,
        },
      ]);

      const { isError } = await callToolText("update_session_status", {
        slug: "bare",
        status: "completed",
      });
      expect(isError).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // list_ideas
  // -----------------------------------------------------------------------

  describe("list_ideas", () => {
    it("returns ideas when configured", async () => {
      mockLoadConfig.mockResolvedValue({
        ...defaultConfig,
        ideas_file: "~/PROJECT_IDEAS.md",
      });
      mockExpandTilde.mockReturnValue("/home/user/PROJECT_IDEAS.md");
      mockParseIdeas.mockReturnValue({
        success: true,
        data: {
          ideas: [
            {
              id: "i_abc12",
              title: "AI Dashboard",
              status: "not-started",
              body: "Build an AI-powered dashboard for metrics",
            },
            {
              id: "i_def34",
              title: "CLI Tool",
              status: "started",
              stack: ["Go", "Bubbletea"],
              body: "Terminal UI for project management",
            },
          ],
        },
      });

      const { json, isError } = await callTool("list_ideas");
      expect(isError).toBeFalsy();
      expect(json).toHaveLength(2);
      expect(json[0].title).toBe("AI Dashboard");
      expect(json[1].stack).toEqual(["Go", "Bubbletea"]);
    });

    it("returns error when ideas_file not configured", async () => {
      mockLoadConfig.mockResolvedValue(defaultConfig);

      const { isError, text } = await callToolText("list_ideas");
      expect(isError).toBe(true);
      expect(text).toContain("No ideas_file configured");
    });

    it("returns error when ideas file not found", async () => {
      mockLoadConfig.mockResolvedValue({
        ...defaultConfig,
        ideas_file: "~/missing.md",
      });
      mockExpandTilde.mockReturnValue("/home/user/missing.md");
      mockReadFile.mockRejectedValue(new Error("ENOENT"));

      const { isError, text } = await callToolText("list_ideas");
      expect(isError).toBe(true);
      expect(text).toContain("Ideas file not found");
    });
  });

  // -----------------------------------------------------------------------
  // get_config
  // -----------------------------------------------------------------------

  describe("get_config", () => {
    it("returns current configuration", async () => {
      const { json, isError } = await callTool("get_config");
      expect(isError).toBeFalsy();
      expect(json.configPath).toBe(mockCONFIG_PATH);
      expect(json.scan_dirs).toEqual(["/projects"]);
      expect(json.scan_depth).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // get_portfolio
  // -----------------------------------------------------------------------

  describe("get_portfolio", () => {
    it("returns projects with portfolio metadata merged", async () => {
      mockLoadAllPortfolios.mockResolvedValue(
        new Map([
          [
            "test-project",
            { scanDir: "/projects", status: "active", order: 0 },
          ],
        ]),
      );

      const { json, isError } = await callTool("get_portfolio");
      expect(isError).toBeFalsy();
      expect(json).toHaveLength(1);
      expect(json[0].slug).toBe("test-project");
      expect(json[0].status).toBe("active");
      expect(json[0].order).toBe(0);
    });

    it("defaults untracked projects to active with no order", async () => {
      mockLoadAllPortfolios.mockResolvedValue(new Map());

      const { json } = await callTool("get_portfolio");
      expect(json[0].status).toBe("active");
      expect(json[0].order).toBeUndefined();
    });

    it("sorts by order, then alphabetical", async () => {
      mockDiscoverProjects.mockResolvedValue([
        {
          name: "Zeta Project",
          slug: "zeta",
          path: "/projects/zeta",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: false,
        },
        {
          name: "Alpha Project",
          slug: "alpha",
          path: "/projects/alpha",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: false,
        },
        {
          name: "Beta Project",
          slug: "beta",
          path: "/projects/beta",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: false,
        },
      ]);
      mockLoadAllPortfolios.mockResolvedValue(
        new Map([
          ["beta", { scanDir: "/projects", status: "active", order: 0 }],
          ["zeta", { scanDir: "/projects", status: "active", order: 1 }],
        ]),
      );

      const { json } = await callTool("get_portfolio");
      expect(json[0].slug).toBe("beta");
      expect(json[1].slug).toBe("zeta");
      expect(json[2].slug).toBe("alpha");
    });
  });

  // -----------------------------------------------------------------------
  // set_project_status
  // -----------------------------------------------------------------------

  describe("set_project_status", () => {
    it("sets project status and saves portfolio", async () => {
      const { text, isError } = await callToolText("set_project_status", {
        slug: "test-project",
        status: "maintenance",
      });
      expect(isError).toBeFalsy();
      expect(text).toContain("maintenance");
      expect(mockSavePortfolio).toHaveBeenCalledOnce();

      const savedPortfolio = mockSavePortfolio.mock.calls[0][1];
      expect(savedPortfolio.projects["test-project"].status).toBe(
        "maintenance",
      );
    });

    it("preserves existing portfolio entries when adding new one", async () => {
      mockLoadPortfolio.mockResolvedValue({
        schema: "cc-dash/portfolio@1",
        projects: {
          "other-project": { status: "active", order: 0 },
        },
      });

      await callToolText("set_project_status", {
        slug: "test-project",
        status: "inactive",
      });

      const savedPortfolio = mockSavePortfolio.mock.calls[0][1];
      expect(savedPortfolio.projects["other-project"].status).toBe("active");
      expect(savedPortfolio.projects["test-project"].status).toBe("inactive");
    });

    it("returns error for unknown project", async () => {
      const { isError, text } = await callToolText("set_project_status", {
        slug: "nonexistent",
        status: "active",
      });
      expect(isError).toBe(true);
      expect(text).toContain("not found");
    });

    it("returns error when scan dir cannot be determined", async () => {
      // Project path doesn't match any scan dir
      mockDiscoverProjects.mockResolvedValue([
        {
          name: "Orphan",
          slug: "orphan",
          path: "/elsewhere/orphan",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: true,
        },
      ]);

      const { isError, text } = await callToolText("set_project_status", {
        slug: "orphan",
        status: "inactive",
      });
      expect(isError).toBe(true);
      expect(text).toContain("scan directory");
    });
  });

  // -----------------------------------------------------------------------
  // reorder_projects
  // -----------------------------------------------------------------------

  describe("reorder_projects", () => {
    it("assigns order based on array position", async () => {
      mockDiscoverProjects.mockResolvedValue([
        {
          name: "Alpha",
          slug: "alpha",
          path: "/projects/alpha",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: false,
        },
        {
          name: "Beta",
          slug: "beta",
          path: "/projects/beta",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: false,
        },
      ]);

      const { text, isError } = await callToolText("reorder_projects", {
        slugs: ["beta", "alpha"],
      });
      expect(isError).toBeFalsy();
      expect(text).toContain("2 projects");
      expect(mockSavePortfolio).toHaveBeenCalledOnce();

      const savedPortfolio = mockSavePortfolio.mock.calls[0][1];
      expect(savedPortfolio.projects.beta.order).toBe(0);
      expect(savedPortfolio.projects.alpha.order).toBe(1);
    });

    it("returns error for unknown slugs", async () => {
      const { isError, text } = await callToolText("reorder_projects", {
        slugs: ["nonexistent"],
      });
      expect(isError).toBe(true);
      expect(text).toContain("Unknown");
    });

    it("preserves existing entries when reordering", async () => {
      mockDiscoverProjects.mockResolvedValue([
        {
          name: "Test Project",
          slug: "test-project",
          path: "/projects/test-project",
          roadmapPath: null,
          sessionPath: null,
          isExplicit: false,
        },
      ]);
      mockLoadPortfolio.mockResolvedValue({
        schema: "cc-dash/portfolio@1",
        projects: {
          "test-project": { status: "maintenance", order: 5 },
        },
      });

      await callToolText("reorder_projects", {
        slugs: ["test-project"],
      });

      const savedPortfolio = mockSavePortfolio.mock.calls[0][1];
      expect(savedPortfolio.projects["test-project"].status).toBe(
        "maintenance",
      );
      expect(savedPortfolio.projects["test-project"].order).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe("error handling", () => {
    it("handles parse failure gracefully for roadmap", async () => {
      mockParseRoadmap.mockReturnValue({
        success: false,
        errors: [{ field: "schema", message: "Invalid schema" }],
      });

      const { isError, text } = await callToolText("update_roadmap_item", {
        slug: "test-project",
        itemId: "r_abc12",
        status: "done",
      });
      expect(isError).toBe(true);
      expect(text).toContain("Failed to parse roadmap");
    });

    it("handles parse failure gracefully for session", async () => {
      mockParseSession.mockReturnValue({
        success: false,
        errors: [{ field: "schema", message: "Invalid schema" }],
      });

      const { isError, text } = await callToolText("get_session", {
        slug: "test-project",
      });
      expect(isError).toBe(true);
      expect(text).toContain("Failed to parse session");
    });

    it("handles write failure gracefully", async () => {
      mockWriteRoadmapFile.mockResolvedValue({
        success: false,
        errors: [{ field: "file", message: "Permission denied" }],
      });

      const { isError, text } = await callToolText("update_roadmap_item", {
        slug: "test-project",
        itemId: "r_abc12",
        name: "Updated",
      });
      expect(isError).toBe(true);
      expect(text).toContain("Failed to write");
    });
  });
});
