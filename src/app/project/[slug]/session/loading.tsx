import { Skeleton } from "@/components/ui/skeleton";

export default function SessionLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="skeleton-title w-48" />
          <Skeleton className="skeleton-text w-64" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Current status card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="skeleton-text w-32 mb-3" />
        <Skeleton className="skeleton-text w-full mb-2" />
        <Skeleton className="skeleton-text w-3/4" />
      </div>

      {/* Task list skeleton */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="skeleton-text w-24 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="skeleton-text flex-1" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Decisions skeleton */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="skeleton-text w-28 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-text w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
