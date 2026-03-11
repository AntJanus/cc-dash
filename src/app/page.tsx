import { getProjectCards } from "@/lib/projects/get-projects";
import { ProjectGrid } from "@/components/projects/project-grid";

export default async function Home() {
  const projects = await getProjectCards();

  return (
    <main className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Projects</h1>
      <ProjectGrid projects={projects} />
    </main>
  );
}
