export default function Loading() {
  return (
    <div className="p-8 lg:p-10">
      {/* Page heading skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Stats bar skeleton */}
      <div className="mb-4 flex items-center gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-5 w-28 animate-pulse rounded bg-muted" />
        ))}
      </div>

      {/* Board columns skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4"
          >
            {/* Column header */}
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            </div>

            {/* Card skeletons */}
            {Array.from({ length: colIdx === 0 ? 3 : 2 }).map((_, cardIdx) => (
              <div
                key={cardIdx}
                className="rounded-xl bg-card p-4 ring-1 ring-foreground/5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
                <div className="mb-2 h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
