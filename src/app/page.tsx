import { getProjectCards } from "@/lib/projects/get-projects";
import { getRecentActivity } from "@/lib/activity/get-activity";
import { ProjectHome } from "@/components/projects/project-home";
import { RightPanel } from "@/components/layout/right-panel";

export default async function Home() {
  const [projects, activity] = await Promise.all([
    getProjectCards(),
    getRecentActivity(10),
  ]);

  // Calculate stats for the right panel
  const stats = {
    active: projects.filter((p) => p.status === "active").length,
    stalled: projects.filter((p) => p.status === "stalled").length,
    complete: projects.filter((p) => p.status === "complete").length,
    totalTasks: projects.reduce((sum, p) => sum + p.totalCount, 0),
  };

  // Generate alerts based on project state
  const alerts: {
    type: "warning" | "info";
    title: string;
    description: string;
  }[] = [];

  // Alert for stalled projects
  const stalledProjects = projects.filter((p) => p.status === "stalled");
  if (stalledProjects.length > 0) {
    alerts.push({
      type: "warning",
      title: `${stalledProjects.length} project${stalledProjects.length > 1 ? "s" : ""} stalled`,
      description: stalledProjects.map((p) => p.name).join(", "),
    });
  }

  // Alert for near-completion projects
  const nearComplete = projects.filter((p) => {
    const percent = p.totalCount > 0 ? (p.doneCount / p.totalCount) * 100 : 0;
    return percent >= 80 && percent < 100;
  });
  if (nearComplete.length > 0) {
    alerts.push({
      type: "info",
      title: `${nearComplete.length} project${nearComplete.length > 1 ? "s" : ""} near completion`,
      description: nearComplete.map((p) => p.name).join(", "),
    });
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Main content area */}
      <div className="flex-1 overflow-auto p-8 lg:p-10">
        <ProjectHome projects={projects} />
      </div>

      {/* Right panel */}
      <RightPanel stats={stats} recentActivity={activity} alerts={alerts} />
    </div>
  );
}
