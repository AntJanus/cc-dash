import { ProjectGridSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 overflow-auto p-8 lg:p-10">
        {/* Page heading skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <div className="skeleton skeleton-title w-32" />
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-28 rounded-lg" />
            <div className="skeleton h-9 w-48 rounded-lg" />
          </div>
        </div>

        {/* Project grid skeleton */}
        <ProjectGridSkeleton count={6} />
      </div>

      {/* Right panel skeleton */}
      <aside className="hidden xl:flex flex-col border-l border-border bg-card w-[340px]">
        <div className="border-b border-[var(--border-light)] p-5">
          <div className="skeleton skeleton-text w-24 mb-4" />
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="skeleton skeleton-text w-32 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className="skeleton skeleton-circle h-8 w-8" />
              <div className="flex-1 space-y-2">
                <div className="skeleton skeleton-text w-3/4" />
                <div className="skeleton skeleton-text w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
