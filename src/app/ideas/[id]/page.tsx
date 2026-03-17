import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIdeasData } from "@/lib/projects/get-ideas";
import { IdeaDetail } from "@/components/ideas/idea-detail";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getIdeasData();

  if (!result) {
    return (
      <main className="container mx-auto p-6">
        <Link
          href="/ideas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ideas
        </Link>
        <p className="text-muted-foreground">Idea not found.</p>
      </main>
    );
  }

  const idea = result.data.ideas.find((i) => i.id === id);

  if (!idea) {
    return (
      <main className="container mx-auto p-6">
        <Link
          href="/ideas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ideas
        </Link>
        <p className="text-muted-foreground">Idea not found.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <Link
        href="/ideas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Ideas
      </Link>
      <IdeaDetail idea={idea} />
    </main>
  );
}
