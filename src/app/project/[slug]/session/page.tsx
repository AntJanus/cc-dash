import { getSessionBySlug } from "@/lib/projects/get-session";
import { SessionView } from "@/components/session/session-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getSessionBySlug(slug);

  if (!data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No active session found
      </div>
    );
  }

  return (
    <SessionView
      session={data.session}
      slug={slug}
      verificationSections={data.verificationSections}
    />
  );
}
