export default function AdminPropertiesLoading() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-8 w-36 bg-surface-container-low animate-pulse rounded-xl" />
        <div className="h-10 w-36 bg-surface-container-low animate-pulse rounded-xl" />
      </div>

      {/* Search bar */}
      <div className="h-12 w-full max-w-sm bg-surface-container-low animate-pulse rounded-xl" />

      {/* Property card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4"
          >
            {/* Address */}
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-4 w-1/2 bg-surface-container-low animate-pulse rounded-lg" />
            </div>

            {/* Status badge + rent */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-surface-container-low animate-pulse rounded-full" />
              <div className="h-5 w-24 bg-surface-container-low animate-pulse rounded-lg" />
            </div>

            {/* Lease info */}
            <div className="border-t border-outline-variant pt-4 space-y-2">
              <div className="h-4 w-full bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-4 w-2/3 bg-surface-container-low animate-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
