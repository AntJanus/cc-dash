import { revalidatePath } from "next/cache";

/**
 * Revalidate all paths that may display data for a given project.
 * Ensures dashboard home, activity feed, and project-specific pages
 * all reflect the latest mutations.
 */
export function revalidateProjectPaths(
  slug: string,
  type: "roadmap" | "session" | "qa",
) {
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath(`/project/${slug}/${type}`);
}

/**
 * Revalidate paths affected by a QA mutation. Failed QA items also
 * mutate ROADMAP.md (auto-filed issue), so both the qa and roadmap
 * surfaces need to refresh, plus the top-level /qa portfolio queue.
 */
export function revalidateQaPaths(slug: string, alsoRoadmap = false) {
  revalidatePath("/");
  revalidatePath("/qa");
  revalidatePath("/activity");
  revalidatePath(`/project/${slug}/qa`);
  if (alsoRoadmap) {
    revalidatePath(`/project/${slug}/roadmap`);
  }
}
