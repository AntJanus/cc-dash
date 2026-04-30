import { getAgentActivity } from "@/lib/activity/get-agent-activity";
import {
  BottomDock,
  type DockTraceEntry,
  type DockActiveProject,
} from "./bottom-dock";

/**
 * Server component that fetches recent agent activity once at layout load
 * and passes a trimmed slice to the client-side dock.
 *
 * Failures degrade to an empty dock (no exception bubbles to the layout).
 */
export async function BottomDockServer() {
  let trace: DockTraceEntry[] = [];
  let active: DockActiveProject[] = [];

  try {
    const activity = await getAgentActivity(40);
    trace = activity.commits.slice(0, 12).map((c) => ({
      hash: c.hash,
      date: c.date,
      agentName: c.agentName,
      projectName: c.projectName,
      projectSlug: c.projectSlug,
      subject: c.subject,
    }));
    // Aggregate commits-per-project from the recent slice and rank.
    const byProject = new Map<string, DockActiveProject & { _max: number }>();
    for (const c of activity.commits) {
      const key = c.projectSlug;
      const t = new Date(c.date).getTime();
      const existing = byProject.get(key);
      if (existing) {
        existing.commitCount += 1;
        if (t > existing._max) {
          existing._max = t;
          existing.lastActive = c.date;
        }
      } else {
        byProject.set(key, {
          slug: c.projectSlug,
          name: c.projectName,
          commitCount: 1,
          lastActive: c.date,
          _max: t,
        });
      }
    }
    active = Array.from(byProject.values())
      .sort((a, b) => b._max - a._max)
      .slice(0, 5)
      .map(({ _max, ...rest }) => {
        void _max;
        return rest;
      });
  } catch {
    // Silent — empty dock is the fallback.
  }

  return <BottomDock trace={trace} active={active} />;
}
