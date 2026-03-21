import { revalidatePath } from "next/cache";

/**
 * Revalidate all paths that may display data for a given project.
 * Ensures dashboard home, activity feed, and project-specific pages
 * all reflect the latest mutations.
 */
export function revalidateProjectPaths(
  slug: string,
  type: "roadmap" | "session",
) {
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath(`/project/${slug}/${type}`);
}
