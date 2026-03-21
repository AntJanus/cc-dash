import { getRecentActivity } from "@/lib/activity/get-activity";
import { ActivityFeed } from "@/components/activity/activity-feed";

export default async function ActivityPage() {
  const events = await getRecentActivity(50);

  return (
    <main className="p-8 lg:p-10">
      <h1 className="mb-6 text-3xl font-semibold">Activity</h1>
      <ActivityFeed events={events} />
    </main>
  );
}
