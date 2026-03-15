"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { refreshAllData } from "@/lib/actions/refresh-action";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A button that refreshes all project data by invalidating
 * the Next.js cache and re-rendering Server Components.
 *
 * Shows a spinning RefreshCw icon while the refresh is in progress
 * and disables itself to prevent double-clicks.
 */
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      await refreshAllData();
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRefresh}
      disabled={isPending}
      aria-label="Refresh all data"
    >
      <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
    </Button>
  );
}
