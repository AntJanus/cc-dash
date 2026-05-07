import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { getProjectCards } from "@/lib/projects/get-projects";
import {
  getPortfolioPulse,
  type PulseLanes,
} from "@/lib/projects/get-portfolio-pulse";
import { pickRecommendedProjects } from "@/lib/projects/pick-recommended";
import { getTodayDirections } from "@/lib/projects/get-today-directions";
import { pickSessionsTouchedToday } from "@/lib/projects/sessions-today";
import { getTopPendingQa } from "@/lib/projects/get-qa-portfolio";
import { PulseLane } from "@/components/today/pulse-lane";
import { RecommendedLane } from "@/components/today/recommended-lane";
import { TodaysDirectionsPanel } from "@/components/today/todays-directions-panel";

const FALLBACK_QA_LIMIT = 5;

type LaneAccent = "emerald" | "blue" | "amber";

interface LaneSpec {
  key: keyof PulseLanes;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: LaneAccent;
  emptyMessage: string;
}

const LANES: LaneSpec[] = [
  {
    key: "nearlyDone",
    title: "Nearly Done",
    subtitle: "80%+ complete — push these over the line",
    icon: CheckCircle2,
    accent: "emerald",
    emptyMessage: "No projects in the home stretch right now.",
  },
  {
    key: "recentlyActive",
    title: "Recently Active",
    subtitle: "Touched in the last 7 days",
    icon: Clock,
    accent: "blue",
    emptyMessage: "No activity this week.",
  },
  {
    key: "stalled",
    title: "Stalled",
    subtitle: "No movement in 14+ days — revive or shelve",
    icon: AlertTriangle,
    accent: "amber",
    emptyMessage: "Nothing stalled — everything's moving.",
  },
];

export default async function TodayPage() {
  const now = new Date();
  const projects = await getProjectCards();
  const pulse = getPortfolioPulse(projects, { now });
  const recommended = pickRecommendedProjects(projects, { now });
  const directions = await getTodayDirections();
  const sessionsToday = pickSessionsTouchedToday(projects, now);
  const topPendingQa = directions
    ? []
    : await getTopPendingQa(FALLBACK_QA_LIMIT);

  const projectNames = new Map(projects.map((p) => [p.slug, p.name]));

  return (
    <main className="p-8 lg:p-10">
      <header className="mb-8">
        <h1
          className="font-serif text-3xl font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Today
        </h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          What to work on, what&apos;s nearly shipped, and what&apos;s stalling.
        </p>
      </header>

      <TodaysDirectionsPanel
        directions={directions}
        projectNames={projectNames}
        sessionsToday={sessionsToday}
        topPendingQa={topPendingQa}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendedLane picks={recommended} />
        {LANES.map((lane) => (
          <PulseLane
            key={lane.key}
            title={lane.title}
            subtitle={lane.subtitle}
            icon={lane.icon}
            accent={lane.accent}
            projects={pulse[lane.key]}
            emptyMessage={lane.emptyMessage}
          />
        ))}
      </div>
    </main>
  );
}
