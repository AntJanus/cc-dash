import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <main className="p-8 lg:p-10">
      <Skeleton className="skeleton-title w-32 mb-6" />

      {/* Filter bar skeleton */}
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Activity list skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="skeleton-circle h-10 w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="skeleton-text w-3/4" />
              <Skeleton className="skeleton-text w-1/2" />
            </div>
            <Skeleton className="skeleton-text w-20 shrink-0" />
          </div>
        ))}
      </div>
    </main>
  );
}
