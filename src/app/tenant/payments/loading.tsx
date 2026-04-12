export default function TenantPaymentsLoading() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="h-8 w-32 bg-surface-container-low animate-pulse rounded-xl" />

      {/* Payment overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-xl" />
            </div>
            <div className="h-8 w-28 bg-surface-container-low animate-pulse rounded-lg" />
            <div className="h-3 w-20 bg-surface-container-low animate-pulse rounded-lg" />
          </div>
        ))}
      </div>

      {/* Payment list */}
      <div className="bg-surface-container rounded-3xl shadow-ambient-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-surface-container-low animate-pulse rounded-lg" />
          <div className="h-9 w-28 bg-surface-container-low animate-pulse rounded-xl" />
        </div>

        {/* Payment rows */}
        <div className="divide-y divide-outline-variant">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-surface-container-low animate-pulse rounded-lg" />
                <div className="h-3 w-28 bg-surface-container-low animate-pulse rounded-lg" />
              </div>
              <div className="h-5 w-20 bg-surface-container-low animate-pulse rounded-lg shrink-0" />
              <div className="h-6 w-20 bg-surface-container-low animate-pulse rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
