import { getRoadmapBySlug } from "@/lib/projects/get-roadmap";
import { RoadmapView } from "@/components/roadmap/roadmap-view";

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
    <RoadmapView
      roadmap={data.roadmap}
      sessionRefs={data.sessionRefs}
      slug={slug}
    />
  );
}
