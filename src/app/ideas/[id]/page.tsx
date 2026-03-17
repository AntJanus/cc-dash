import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIdeasData } from "@/lib/projects/get-ideas";
import { IdeaDetail } from "@/components/ideas/idea-detail";
import { IdeaMetadataEditor } from "@/components/ideas/idea-metadata-editor";
import { IdeaBodyEditor } from "@/components/ideas/idea-body-editor";
import { DeleteIdeaDialog } from "@/components/ideas/delete-idea-dialog";

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
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/ideas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ideas
        </Link>
        <DeleteIdeaDialog
          ideaId={idea.id}
          ideaTitle={idea.title}
          ideaStatus={idea.status}
        />
      </div>
      <IdeaDetail idea={idea} />
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_300px]">
        <IdeaBodyEditor idea={idea}>
          <IdeaDetail idea={idea} />
        </IdeaBodyEditor>
        <IdeaMetadataEditor idea={idea} />
      </div>
    </main>
  );
}
