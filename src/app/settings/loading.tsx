export default function Loading() {
  return (
    <main className="p-8 lg:p-10">
      <div className="skeleton skeleton-title w-28 mb-6" />

      <div className="max-w-2xl space-y-6">
        {/* Scan directories section */}
        <div className="space-y-3">
          <div className="skeleton skeleton-text w-36" />
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>

        {/* Exclude directories section */}
        <div className="space-y-3">
          <div className="skeleton skeleton-text w-40" />
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>

        {/* Scan depth */}
        <div className="space-y-3">
          <div className="skeleton skeleton-text w-24" />
          <div className="skeleton h-10 w-32 rounded-lg" />
        </div>

        {/* Save button */}
        <div className="skeleton h-9 w-20 rounded-lg" />
      </div>
    </main>
  );
}
