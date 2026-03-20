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
      <main className="p-6 lg:p-8">
        <p className="text-muted-foreground">Idea not found.</p>
      </main>
    );
  }

  const idea = result.data.ideas.find((i) => i.id === id);

  if (!idea) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-muted-foreground">Idea not found.</p>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-end">
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
