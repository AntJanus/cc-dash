import { getQaBySlug } from "@/lib/projects/get-qa";
import { QaView } from "@/components/qa/qa-view";
import { QaFocus } from "@/components/qa/qa-focus";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ focus?: string }>;
}

export default async function ProjectQaPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { focus } = await searchParams;
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

  if (focus) {
    return (
      <div>
        <div className="mb-4">
          <h1 className="text-xl font-semibold">{data.qa.project}</h1>
        </div>
        <QaFocus
          qa={data.qa}
          slug={slug}
          hasRoadmap={data.hasRoadmap}
          initialFocusId={focus}
        />
      </div>
    );
  }

  const firstPending = data.qa.items.find((item) => item.status === "pending");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{data.qa.project}</h1>
        {firstPending && (
          <a
            href={`/project/${slug}/qa?focus=${firstPending.id}`}
            className="inline-flex items-center rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start focus mode
          </a>
        )}
      </div>
      <QaView qa={data.qa} slug={slug} hasRoadmap={data.hasRoadmap} />
    </div>
  );
}
