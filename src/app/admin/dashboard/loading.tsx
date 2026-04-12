export default function AdminDashboardLoading() {
  return (
    <section className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-surface-container-low animate-pulse rounded-xl" />
          <div className="h-4 w-64 bg-surface-container-low animate-pulse rounded-lg" />
        </div>
        <div className="h-5 w-32 bg-surface-container-low animate-pulse rounded-full" />
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-xl" />
            </div>
            <div className="h-8 w-20 bg-surface-container-low animate-pulse rounded-lg" />
          </div>
        ))}
      </div>

      {/* Rent collection + chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rent collection card */}
        <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="h-6 w-40 bg-surface-container-low animate-pulse rounded-lg" />
          <div className="h-4 w-full bg-surface-container-low animate-pulse rounded-full" />
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-surface-container-low animate-pulse rounded-lg" />
            <div className="h-4 w-24 bg-surface-container-low animate-pulse rounded-lg" />
          </div>
        </div>

        {/* Revenue chart card */}
        <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="h-6 w-36 bg-surface-container-low animate-pulse rounded-lg" />
          <div className="h-48 w-full bg-surface-container-low animate-pulse rounded-xl" />
        </div>
      </div>

      {/* Activity sections row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="h-6 w-36 bg-surface-container-low animate-pulse rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-surface-container-low animate-pulse rounded-lg" />
                <div className="h-3 w-1/2 bg-surface-container-low animate-pulse rounded-lg" />
              </div>
              <div className="h-5 w-16 bg-surface-container-low animate-pulse rounded-full" />
            </div>
          ))}
        </div>

        {/* Maintenance requests */}
        <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="h-6 w-44 bg-surface-container-low animate-pulse rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-surface-container-low animate-pulse rounded-lg" />
                <div className="h-3 w-1/2 bg-surface-container-low animate-pulse rounded-lg" />
              </div>
              <div className="h-5 w-20 bg-surface-container-low animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
