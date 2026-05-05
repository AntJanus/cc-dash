/**
 * Data loading function for the top-level /qa portfolio queue page.
 *
 * Walks every discovered project, loads each project's QA.md if present,
 * and returns a summary card per project: counts by status, last_updated,
 * and roadmap availability.
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseQa } from "@/lib/fs";
import type { QaItem } from "@/lib/schemas/qa";

export interface QaPortfolioCard {
  slug: string;
  name: string;
  lastUpdated: string;
  hasRoadmap: boolean;
  total: number;
  pending: number;
  passed: number;
  failed: number;
  needsDecision: number;
  skipped: number;
  /** First few pending item descriptions for preview. */
  upcomingPreview: string[];
}

function emptyCounts() {
  return {
    pending: 0,
    passed: 0,
    failed: 0,
    needsDecision: 0,
    skipped: 0,
  };
}

function tally(items: QaItem[]) {
  const counts = emptyCounts();
  for (const item of items) {
    switch (item.status) {
      case "pending":
        counts.pending++;
        break;
      case "passed":
        counts.passed++;
        break;
      case "failed":
        counts.failed++;
        break;
      case "needs-decision":
        counts.needsDecision++;
        break;
      case "skipped":
        counts.skipped++;
        break;
    }
  }
  return counts;
}

/**
 * Load all projects' QA summaries for the portfolio queue.
 * Sorted: most pending items first, then most recently updated.
 */
export async function getQaPortfolio(): Promise<QaPortfolioCard[]> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);

  const cards: QaPortfolioCard[] = [];

  for (const project of projects) {
    if (!project.qaPath) continue;
    let raw: string;
    try {
      raw = await readFile(project.qaPath, "utf-8");
    } catch {
      continue;
    }
    const parsed = parseQa(raw, project.qaPath);
    if (!parsed.success) continue;

    const counts = tally(parsed.data.items);
    const upcomingPreview = parsed.data.items
      .filter((item) => item.status === "pending")
      .slice(0, 3)
      .map((item) => item.description);

    cards.push({
      slug: project.slug,
      name: project.name,
      lastUpdated: parsed.data.last_updated,
      hasRoadmap: project.roadmapPath !== null,
      total: parsed.data.items.length,
      ...counts,
      upcomingPreview,
    });
  }

  cards.sort((left, right) => {
    if (left.pending !== right.pending) return right.pending - left.pending;
    return right.lastUpdated.localeCompare(left.lastUpdated);
  });

  return cards;
}
