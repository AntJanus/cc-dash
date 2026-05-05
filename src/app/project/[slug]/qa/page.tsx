import { getQaBySlug } from "@/lib/projects/get-qa";
import { QaView } from "@/components/qa/qa-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectQaPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getQaBySlug(slug);

  if (!data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="mb-2 text-base font-medium text-foreground">
          No QA file for this project.
        </p>
        <p className="text-sm">
          Add a <code className="rounded bg-muted px-1">QA.md</code> with{" "}
          <code className="rounded bg-muted px-1">cc-dash/qa@1</code>{" "}
          frontmatter to start manual QA here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{data.qa.project}</h1>
      </div>
      <QaView qa={data.qa} slug={slug} hasRoadmap={data.hasRoadmap} />
    </div>
  );
}
