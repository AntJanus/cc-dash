/**
 * In-memory cache for project discovery results.
 *
 * Wraps discoverProjects() to avoid repeated filesystem scans.
 * Call invalidate() when you know files have changed (e.g., from chokidar watcher)
 * to trigger a re-scan on the next getProjects() call.
 */

import { discoverProjects, type DiscoveredProject } from "./discovery";
import type { Config } from "@/lib/schemas/config";

export class DiscoveryCache {
  private projects: DiscoveredProject[] | null = null;
  private lastScanTime: number = 0;

  /**
   * Get discovered projects. Returns cached results if available,
   * otherwise performs a fresh scan.
   */
  async getProjects(config: Config): Promise<DiscoveredProject[]> {
    if (this.projects !== null) return this.projects;
    this.projects = await discoverProjects(config);
    this.lastScanTime = Date.now();
    return this.projects;
  }

  /**
   * Invalidate the cache, causing the next getProjects() call to re-scan.
   */
  invalidate(): void {
    this.projects = null;
  }

  /**
   * Get the timestamp of the last scan. Returns 0 if no scan has occurred.
   */
  getLastScanTime(): number {
    return this.lastScanTime;
  }
}
