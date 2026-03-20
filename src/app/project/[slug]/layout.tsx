import { ProjectTabs } from "@/components/layout/project-tabs";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <ProjectTabs slug={slug} />
      </div>
      {children}
    </div>
  );
}
