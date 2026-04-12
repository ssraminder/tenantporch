export default function AdminFinancialsLoading() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="h-8 w-36 bg-surface-container-low animate-pulse rounded-xl" />

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-28 bg-surface-container-low animate-pulse rounded-xl"
          />
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-surface-container-low animate-pulse rounded-lg" />
            <div className="h-3 w-20 bg-surface-container-low animate-pulse rounded-lg" />
          </div>
        ))}
      </div>

      {/* Chart / table area */}
      <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-surface-container-low animate-pulse rounded-lg" />
          <div className="h-9 w-32 bg-surface-container-low animate-pulse rounded-xl" />
        </div>

        {/* Table header */}
        <div className="flex gap-4 border-b border-outline-variant pb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-4 flex-1 bg-surface-container-low animate-pulse rounded-lg"
            />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 bg-surface-container-low animate-pulse rounded-lg"
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
