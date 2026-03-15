"use server";

import { revalidatePath } from "next/cache";

/**
 * Invalidate all cached pages by revalidating the root layout.
 *
 * This causes Next.js to re-run all Server Components on the next
 * request, which re-reads project files from disk. No DiscoveryCache
 * integration needed -- code calls discoverProjects directly, so
 * revalidatePath alone suffices.
 */
export async function refreshAllData(): Promise<void> {
  revalidatePath("/", "layout");
}
