import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          All Projects
        </Link>
        <nav className="mt-4 flex gap-4 border-b">
          <Link
            href={`/project/${slug}/roadmap`}
            className="border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            Roadmap
          </Link>
          <Link
            href={`/project/${slug}/session`}
            className="border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            Session
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
