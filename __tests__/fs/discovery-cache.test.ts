/**
 * Tests for DiscoveryCache.
 *
 * Mocks discoverProjects to verify caching behavior:
 * - First call triggers scan, subsequent calls use cache
 * - invalidate() causes next call to re-scan
 * - getLastScanTime tracks when last scan occurred
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Config } from "@/lib/schemas/config";
import type { DiscoveredProject } from "@/lib/fs/discovery";

// Mock discoverProjects using vi.hoisted pattern
const { mockDiscoverProjects } = vi.hoisted(() => ({
  mockDiscoverProjects: vi.fn(),
}));

vi.mock("@/lib/fs/discovery", () => ({
  discoverProjects: mockDiscoverProjects,
}));

// Import after mock setup
import { DiscoveryCache } from "@/lib/fs/discovery-cache";

/** Helper: create a default config */
function makeConfig(): Config {
  return {
    scan_dirs: [],
    exclude_dirs: ["node_modules", ".git", "vendor"],
    explicit_projects: [],
    scan_depth: 2,
    port: 3000,
  };
}

/** Fixture: sample discovered projects */
const SAMPLE_PROJECTS: DiscoveredProject[] = [
  {
    name: "project-a",
    slug: "project-a",
    path: "/tmp/project-a",
    roadmapPath: "/tmp/project-a/ROADMAP.md",
    sessionPath: null,
    qaPath: null,
    isExplicit: false,
  },
  {
    name: "project-b",
    slug: "project-b",
    path: "/tmp/project-b",
    roadmapPath: null,
    sessionPath: "/tmp/project-b/SESSION_PROGRESS.md",
    qaPath: null,
    isExplicit: true,
  },
];

describe("DiscoveryCache", () => {
  let cache: DiscoveryCache;
  const config = makeConfig();

  beforeEach(() => {
    cache = new DiscoveryCache();
    mockDiscoverProjects.mockReset();
    mockDiscoverProjects.mockResolvedValue(SAMPLE_PROJECTS);
  });

  it("first call to getProjects calls discoverProjects and returns results", async () => {
    const results = await cache.getProjects(config);
    expect(mockDiscoverProjects).toHaveBeenCalledTimes(1);
    expect(mockDiscoverProjects).toHaveBeenCalledWith(config);
    expect(results).toEqual(SAMPLE_PROJECTS);
  });

  it("second call to getProjects returns cached results without calling discoverProjects again", async () => {
    await cache.getProjects(config);
    const results = await cache.getProjects(config);

    expect(mockDiscoverProjects).toHaveBeenCalledTimes(1);
    expect(results).toEqual(SAMPLE_PROJECTS);
  });

  it("after invalidate(), next getProjects calls discoverProjects again", async () => {
    await cache.getProjects(config);
    expect(mockDiscoverProjects).toHaveBeenCalledTimes(1);

    cache.invalidate();

    const updatedProjects: DiscoveredProject[] = [
      { ...SAMPLE_PROJECTS[0], name: "updated-a" },
    ];
    mockDiscoverProjects.mockResolvedValue(updatedProjects);

    const results = await cache.getProjects(config);
    expect(mockDiscoverProjects).toHaveBeenCalledTimes(2);
    expect(results).toEqual(updatedProjects);
  });

  it("getLastScanTime returns 0 before first scan", () => {
    expect(cache.getLastScanTime()).toBe(0);
  });

  it("getLastScanTime returns a positive number after getProjects completes", async () => {
    const before = Date.now();
    await cache.getProjects(config);
    const after = Date.now();

    const scanTime = cache.getLastScanTime();
    expect(scanTime).toBeGreaterThanOrEqual(before);
    expect(scanTime).toBeLessThanOrEqual(after);
  });

  it("getLastScanTime updates after re-scan following invalidate", async () => {
    await cache.getProjects(config);
    const firstScanTime = cache.getLastScanTime();

    // Small delay to ensure timestamps differ
    await new Promise((resolve) => setTimeout(resolve, 10));

    cache.invalidate();
    await cache.getProjects(config);
    const secondScanTime = cache.getLastScanTime();

    expect(secondScanTime).toBeGreaterThan(firstScanTime);
  });
});
