import { getRoadmapBySlug } from "@/lib/projects/get-roadmap";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { PromptButton } from "@/components/prompt/prompt-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RoadmapPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getRoadmapBySlug(slug);

  if (!data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Project not found
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{data.roadmap.project}</h1>
        <PromptButton slug={slug} />
      </div>
      <RoadmapView
        roadmap={data.roadmap}
        sessionRefs={data.sessionRefs}
        slug={slug}
      />
    </div>
  );
}
