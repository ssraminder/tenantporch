export default function TenantDashboardLoading() {
  return (
    <section className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-56 bg-surface-container-low animate-pulse rounded-xl" />
        <div className="h-4 w-72 bg-surface-container-low animate-pulse rounded-lg" />
      </div>

      {/* Lease card + Payment card row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lease card */}
        <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-28 bg-surface-container-low animate-pulse rounded-lg" />
            <div className="h-6 w-20 bg-surface-container-low animate-pulse rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-3/4 bg-surface-container-low animate-pulse rounded-lg" />
            <div className="h-4 w-1/2 bg-surface-container-low animate-pulse rounded-lg" />
          </div>
          <div className="border-t border-outline-variant pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="h-3 w-16 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-5 w-24 bg-surface-container-low animate-pulse rounded-lg" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-16 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-5 w-24 bg-surface-container-low animate-pulse rounded-lg" />
            </div>
          </div>
        </div>

        {/* Payment card */}
        <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-surface-container-low animate-pulse rounded-lg" />
            <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-xl" />
          </div>
          <div className="h-10 w-32 bg-surface-container-low animate-pulse rounded-lg" />
          <div className="h-4 w-48 bg-surface-container-low animate-pulse rounded-lg" />
          <div className="h-11 w-full bg-surface-container-low animate-pulse rounded-xl" />
        </div>
      </div>

      {/* Quick actions + notifications row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="h-6 w-28 bg-surface-container-low animate-pulse rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-surface-container-low animate-pulse rounded-xl"
              />
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="h-6 w-32 bg-surface-container-low animate-pulse rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 bg-surface-container-low animate-pulse rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-3/4 bg-surface-container-low animate-pulse rounded-lg" />
                <div className="h-3 w-1/3 bg-surface-container-low animate-pulse rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
