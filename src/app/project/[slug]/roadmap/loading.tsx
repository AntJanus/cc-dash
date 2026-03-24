import { Skeleton } from "@/components/ui/skeleton";

export default function RoadmapLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="skeleton-title w-48" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* View toggle and stats skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-text w-20" />
          ))}
        </div>
      </div>

      {/* Board columns skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col gap-3 rounded-xl p-4"
            style={{ background: "var(--bg-accent)" }}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="skeleton-circle h-3 w-3" />
              <Skeleton className="skeleton-text w-24" />
              <Skeleton className="skeleton-text w-6" />
            </div>

            {/* Card skeletons */}
            {Array.from({ length: colIdx === 0 ? 3 : 2 }).map((_, cardIdx) => (
              <div
                key={cardIdx}
                className="rounded-xl bg-card p-4 border border-border"
              >
                <Skeleton className="skeleton-text w-3/4 mb-2" />
                <Skeleton className="skeleton-text w-full mb-2" />
                <Skeleton className="skeleton-text w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
