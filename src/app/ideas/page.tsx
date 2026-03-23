import { getIdeasData } from "@/lib/projects/get-ideas";
import { IdeasGrid } from "@/components/ideas/ideas-grid";
import { IdeaForm } from "@/components/ideas/idea-form";
import { IdeaWizard } from "@/components/ideas/idea-wizard";

export default async function IdeasPage() {
  const result = await getIdeasData();
  if (!result) {
    return (
      <main className="p-8 lg:p-10">
        <h1 className="mb-4 text-xl font-semibold">Project Ideas</h1>
        <p className="text-muted-foreground">
          No ideas file configured. Add ideas_file to your cc-dash config.
        </p>
      </main>
    );
  }
  return (
    <main className="p-8 lg:p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Project Ideas</h1>
        <div className="flex gap-2">
          <IdeaForm />
          <IdeaWizard />
        </div>
      </div>
      <IdeasGrid ideas={result.data.ideas} />
    </main>
  );
}
