export default function Loading() {
  return (
    <main className="p-8 lg:p-10">
      {/* Delete button area */}
      <div className="mb-4 flex items-center justify-end">
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>

      {/* Idea detail header skeleton */}
      <div className="mb-6 space-y-3">
        <div className="skeleton skeleton-title w-64" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Body + metadata grid skeleton */}
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Body editor skeleton */}
        <div className="space-y-3">
          <div className="skeleton skeleton-text w-full" />
          <div className="skeleton skeleton-text w-5/6" />
          <div className="skeleton skeleton-text w-4/6" />
          <div className="skeleton skeleton-text w-full" />
          <div className="skeleton skeleton-text w-3/4" />
        </div>

        {/* Metadata sidebar skeleton */}
        <div className="space-y-4">
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-lg" />
        </div>
      </div>
    </main>
  );
}
