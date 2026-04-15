import {
  BarChart3,
  TrendingUp,
  PieChart,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { getProjectCards } from "@/lib/projects/get-projects";
import { getRecentActivity } from "@/lib/activity/get-activity";
import { computePortfolioMetrics } from "@/lib/metrics/portfolio-metrics";
import { StatusChart } from "@/components/metrics/status-chart";
import { VelocityChart } from "@/components/metrics/velocity-chart";
import { ProgressDistribution } from "@/components/metrics/progress-distribution";
import { StaleProjectsList } from "@/components/metrics/stale-projects-list";
import { MostActiveList } from "@/components/metrics/most-active-list";

export default async function MetricsPage() {
  const [projects, events] = await Promise.all([
    getProjectCards(),
    getRecentActivity(50),
  ]);

  const metrics = computePortfolioMetrics(projects, events);

  return (
    <main className="p-8 lg:p-10">
      <h1 className="mb-8 text-xl font-semibold">Portfolio Metrics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Projects"
          value={metrics.totalProjects}
          color="teal"
        />
        <SummaryCard
          label="Completion"
          value={`${metrics.overallCompletion}%`}
          color="emerald"
        />
        <SummaryCard
          label="Items Done"
          value={metrics.itemCounts.done}
          color="blue"
        />
        <SummaryCard
          label="Remaining"
          value={metrics.itemCounts.planned}
          color="violet"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <MetricsCard title="Project Status" icon={PieChart} color="teal">
          <StatusChart
            distribution={metrics.statusDistribution}
            total={metrics.totalProjects}
          />
        </MetricsCard>

        {/* Velocity */}
        <MetricsCard title="Weekly Velocity" icon={TrendingUp} color="blue">
          <VelocityChart buckets={metrics.velocity} />
        </MetricsCard>

        {/* Progress Distribution */}
        <MetricsCard
          title="Progress Distribution"
          icon={BarChart3}
          color="violet"
        >
          <ProgressDistribution
            buckets={metrics.progressDistribution}
            totalProjects={metrics.totalProjects}
          />
        </MetricsCard>

        {/* Most Active */}
        <MetricsCard title="Most Active" icon={Zap} color="emerald">
          <MostActiveList projects={metrics.mostActive} />
        </MetricsCard>

        {/* Stale Projects — full width */}
        <div className="lg:col-span-2">
          <MetricsCard
            title="Stale Projects"
            icon={AlertTriangle}
            color="amber"
            subtitle={`${metrics.staleProjects.length} project${metrics.staleProjects.length !== 1 ? "s" : ""} not updated in 7+ days`}
          >
            <StaleProjectsList projects={metrics.staleProjects} />
          </MetricsCard>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
      }}
    >
      <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="text-2xl font-bold"
        style={{ color: `var(--accent-${color})` }}
      >
        {value}
      </p>
    </div>
  );
}

function MetricsCard({
  title,
  icon: Icon,
  color,
  subtitle,
  children,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{
            background: `var(--accent-${color}-light)`,
            color: `var(--accent-${color})`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
