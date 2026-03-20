import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { loadConfig } from "@/lib/config";
import { discoverProjects, parseRoadmap, parseSession } from "@/lib/fs";
import type { ActivityEvent } from "./types";

/**
 * Get recent activity events across all projects.
 * Extracts events from roadmap item dates and session timestamps.
 */
export async function getRecentActivity(limit = 50): Promise<ActivityEvent[]> {
  const config = await loadConfig();
  const discovered = await discoverProjects(config);

  const allEvents: ActivityEvent[] = [];

  await Promise.allSettled(
    discovered.map(async (project) => {
      const slug = basename(project.path);
      const name = project.name;

      // Extract roadmap events
      if (project.roadmapPath) {
        try {
          const raw = await readFile(project.roadmapPath, "utf-8");
          const result = parseRoadmap(raw, project.roadmapPath);
          if (result.success) {
            for (const category of result.data.categories) {
              for (const item of category.items) {
                if (item.completed) {
                  allEvents.push({
                    id: `${item.id}-completed`,
                    type: "roadmap_item_completed",
                    timestamp: item.completed + "T00:00:00Z",
                    projectSlug: slug,
                    projectName: name,
                    title: `Completed: ${item.name}`,
                    description: item.description,
                    link: `/project/${slug}/roadmap`,
                  });
                }
                if (item.started) {
                  allEvents.push({
                    id: `${item.id}-started`,
                    type: "roadmap_item_started",
                    timestamp: item.started + "T00:00:00Z",
                    projectSlug: slug,
                    projectName: name,
                    title: `Started: ${item.name}`,
                    description: item.description,
                    link: `/project/${slug}/roadmap`,
                  });
                }
              }
            }
          }
        } catch {
          // skip unreadable files
        }
      }

      // Extract session events
      if (project.sessionPath) {
        try {
          const raw = await readFile(project.sessionPath, "utf-8");
          const result = parseSession(raw, project.sessionPath);
          if (result.success) {
            const session = result.data;

            // Session started event
            allEvents.push({
              id: `${session.session_id}-started`,
              type: "session_started",
              timestamp: session.started,
              projectSlug: slug,
              projectName: name,
              title: `Session started: ${session.session_id}`,
              link: `/project/${slug}/session`,
            });

            // Completed work events
            for (const entry of session.completedWork) {
              allEvents.push({
                id: `${session.session_id}-work-${entry.taskRef}`,
                type: "session_work_completed",
                timestamp: entry.timestamp,
                projectSlug: slug,
                projectName: name,
                title: `Work completed: ${entry.description}`,
                link: `/project/${slug}/session`,
              });
            }
          }
        } catch {
          // skip unreadable files
        }
      }
    }),
  );

  // Sort by timestamp descending, return top limit
  return allEvents
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}
