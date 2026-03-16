import { getProjectCards } from "@/lib/projects/get-projects";
import { ProjectGrid } from "@/components/projects/project-grid";
import { CrossProjectPromptButton } from "@/components/prompt/cross-project-prompt-button";

export default async function Home() {
  const projects = await getProjectCards();

  return (
    <main className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <CrossProjectPromptButton />
      </div>
      <ProjectGrid projects={projects} />
    </main>
  );
}
