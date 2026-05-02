import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { getProjectCards } from "@/lib/projects/get-projects";
import {
  getPortfolioPulse,
  type PulseLanes,
} from "@/lib/projects/get-portfolio-pulse";
import { PulseLane } from "@/components/today/pulse-lane";

type LaneAccent = "teal" | "emerald" | "blue" | "amber";

interface LaneSpec {
  key: keyof PulseLanes;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: LaneAccent;
  emptyMessage: string;
  showNextAction?: boolean;
}

const LANES: LaneSpec[] = [
  {
    key: "upNext",
    title: "Up Next",
    subtitle: "One next action per project, most recently touched first",
    icon: ArrowRight,
    accent: "teal",
    emptyMessage:
      "Nothing planned across the portfolio. Add roadmap items to surface them here.",
    showNextAction: true,
  },
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
  const projects = await getProjectCards();
  const pulse = getPortfolioPulse(projects);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {LANES.map((lane) => (
          <PulseLane
            key={lane.key}
            title={lane.title}
            subtitle={lane.subtitle}
            icon={lane.icon}
            accent={lane.accent}
            projects={pulse[lane.key]}
            emptyMessage={lane.emptyMessage}
            showNextAction={lane.showNextAction}
          />
        ))}
      </div>
    </main>
  );
}
