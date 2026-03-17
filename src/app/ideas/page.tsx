import { getIdeasData } from "@/lib/projects/get-ideas";
import { IdeasGrid } from "@/components/ideas/ideas-grid";

export default async function IdeasPage() {
  const result = await getIdeasData();
  if (!result) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Project Ideas</h1>
        <p className="text-muted-foreground">
          No ideas file configured. Add ideas_file to your cc-dash config.
        </p>
      </main>
    );
  }
  return (
    <main className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Project Ideas</h1>
      </div>
      <IdeasGrid ideas={result.data.ideas} />
    </main>
  );
}
