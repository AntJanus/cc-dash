import { Skeleton } from "@/components/ui/skeleton";

export default function IdeasLoading() {
  return (
    <main className="p-8 lg:p-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="skeleton-title w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Ideas grid skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border-l-[3px] border border-border bg-card p-5"
            style={{ borderLeftColor: "var(--status-inactive)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="skeleton-title w-40" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            <Skeleton className="skeleton-text w-full mb-2" />
            <Skeleton className="skeleton-text w-3/4" />
          </div>
        ))}
      </div>
    </main>
  );
}
