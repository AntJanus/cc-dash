import Image from "next/image";
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
import { MastheadBand } from "@/components/today/masthead-band";
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
  glyphSrc: string;
  accent: LaneAccent;
  emptyMessage: string;
}

const LANES: LaneSpec[] = [
  {
    key: "nearlyDone",
    title: "Nearly Done",
    subtitle: "80%+ complete — push these over the line",
    icon: CheckCircle2,
    glyphSrc: "/today/glyph-nearly-done.png",
    accent: "emerald",
    emptyMessage: "No projects in the home stretch right now.",
  },
  {
    key: "recentlyActive",
    title: "Recently Active",
    subtitle: "Touched in the last 7 days",
    icon: Clock,
    glyphSrc: "/today/glyph-recently-active.png",
    accent: "blue",
    emptyMessage: "No activity this week.",
  },
  {
    key: "stalled",
    title: "Stalled",
    subtitle: "No movement in 14+ days — revive or shelve",
    icon: AlertTriangle,
    glyphSrc: "/today/glyph-stalled.png",
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
      <MastheadBand
        now={now}
        tagline="What to work on, what's nearly shipped, and what's stalling."
      />

      <TodaysDirectionsPanel
        directions={directions}
        projectNames={projectNames}
        sessionsToday={sessionsToday}
        topPendingQa={topPendingQa}
      />

      <section className="mb-10">
        <SectionHeader eyebrow="Field Survey" title="Portfolio Pulse" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {LANES.map((lane) => (
            <PulseLane
              key={lane.key}
              title={lane.title}
              subtitle={lane.subtitle}
              icon={lane.icon}
              glyphSrc={lane.glyphSrc}
              accent={lane.accent}
              projects={pulse[lane.key]}
              emptyMessage={lane.emptyMessage}
            />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <RecommendedLane picks={recommended} />
      </section>
    </main>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-[var(--border-light)] pb-3">
      <div>
        <p className="almanac-eyebrow-label mb-1">{eyebrow}</p>
        <h2 className="almanac-section-title">{title}</h2>
      </div>
      <Image
        src="/today/divider-sprig.png"
        alt=""
        width={1080}
        height={72}
        className="ink-art hidden h-10 w-auto opacity-70 sm:block"
      />
    </div>
  );
}
