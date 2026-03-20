import Link from "next/link";
import { getProjectCards } from "@/lib/projects/get-projects";
import { getRecentActivity } from "@/lib/activity/get-activity";
import { ProjectGrid } from "@/components/projects/project-grid";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { CrossProjectPromptButton } from "@/components/prompt/cross-project-prompt-button";

export default async function Home() {
  const [projects, activity] = await Promise.all([
    getProjectCards(),
    getRecentActivity(10),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <CrossProjectPromptButton />
      </div>
      <ProjectGrid projects={projects} />

      {activity.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Recent Activity</h2>
            <Link
              href="/activity"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <ActivityFeed events={activity} compact />
        </section>
      )}
    </div>
  );
}
