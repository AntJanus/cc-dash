"use server";

/**
 * Server actions for prompt generation.
 *
 * Re-reads files fresh on each call (not from cached dashboard data)
 * to ensure prompts reflect the latest file state.
 */

import { readFile } from "node:fs/promises";
import { loadConfig } from "@/lib/config";
import {
  discoverProjects,
  parseQa,
  parseRoadmap,
  parseSession,
} from "@/lib/fs";
import { getProjectCards } from "@/lib/projects/get-projects";
import { pickRecommendedProjects } from "@/lib/projects/pick-recommended";
import { pickSessionsTouchedToday } from "@/lib/projects/sessions-today";
import {
  assembleProjectPrompt,
  pickBestProject,
} from "@/lib/prompt/generate-prompt";
import {
  assembleTodayDirectionsPrompt,
  type TodayQaSummary,
} from "@/lib/prompt/today-directions-prompt";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";

type PromptResult =
  | { success: true; prompt: string }
  | { success: false; error: string };

/**
 * Generate a context-rich prompt for a specific project.
 *
 * Re-reads roadmap and session files fresh from disk.
 */
export async function generateProjectPrompt(
  slug: string,
): Promise<PromptResult> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  let roadmap: RoadmapFile | null = null;
  let session: SessionFile | null = null;

  // Read roadmap fresh
  if (project.roadmapPath) {
    try {
      const raw = await readFile(project.roadmapPath, "utf-8");
      const result = parseRoadmap(raw, project.roadmapPath);
      if (result.success) roadmap = result.data;
    } catch {
      // File unreadable, continue without roadmap
    }
  }

  // Read session fresh
  if (project.sessionPath) {
    try {
      const raw = await readFile(project.sessionPath, "utf-8");
      const result = parseSession(raw, project.sessionPath);
      if (result.success) session = result.data;
    } catch {
      // File unreadable, continue without session
    }
  }

  const prompt = assembleProjectPrompt(
    project.path,
    project.name,
    roadmap,
    session,
  );

  return { success: true, prompt };
}

/**
 * Generate a prompt for the best project to work on next.
 *
 * Uses getProjectCards() for ranking data, then pickBestProject
 * heuristic, then delegates to generateProjectPrompt for fresh reads.
 */
export async function generateCrossProjectPrompt(): Promise<PromptResult> {
  const cards = await getProjectCards();

  const candidates = cards.map((card) => ({
    slug: card.slug,
    path: card.path,
    name: card.name,
    hasActiveSession: card.hasActiveSession,
    lastUpdated: card.lastUpdated,
    isStale: card.isStale,
    status: card.status,
  }));

  const best = pickBestProject(candidates);

  if (!best) {
    return {
      success: false,
      error: "All projects are up to date! No work to suggest.",
    };
  }

  return generateProjectPrompt(best.slug);
}

const DEFAULT_TOP_QA_LIMIT = 6;

async function gatherTopQaItems(limit: number): Promise<TodayQaSummary[]> {
  const config = await loadConfig();
  const projects = await discoverProjects(config);
  const out: TodayQaSummary[] = [];

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

    for (const item of parsed.data.items) {
      if (item.status !== "pending") continue;
      out.push({
        qaId: item.id,
        slug: project.slug,
        projectName: project.name,
        description: item.description,
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Generate the "Today's Directions" prompt. Re-reads portfolio state
 * fresh, then assembles a context-rich prompt the user pastes to a
 * Claude agent running in the configured orchestrator directory.
 */
export async function generateTodayDirectionsPrompt(): Promise<PromptResult> {
  const now = new Date();
  const config = await loadConfig();
  const projects = await getProjectCards();
  const sessionsToday = pickSessionsTouchedToday(projects, now);
  const recommended = pickRecommendedProjects(projects, { now });
  const topQa = await gatherTopQaItems(DEFAULT_TOP_QA_LIMIT);

  const prompt = assembleTodayDirectionsPrompt({
    now,
    sessionsToday,
    topQa,
    recommended,
    orchestratorDir: config.orchestrator_dir,
  });

  return { success: true, prompt };
}
