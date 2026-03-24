import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton", className)}
      {...props}
    />
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Skeleton className="h-10 w-10 rounded-lg mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex items-center gap-3.5 mb-4">
        <Skeleton className="h-[52px] w-[52px] rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3.5 border-t border-[var(--border-light)]">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export { Skeleton, ProjectCardSkeleton, ProjectGridSkeleton };
