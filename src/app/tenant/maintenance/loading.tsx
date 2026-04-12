export default function TenantMaintenanceLoading() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-8 w-48 bg-surface-container-low animate-pulse rounded-xl" />
        <div className="h-10 w-36 bg-surface-container-low animate-pulse rounded-xl" />
      </div>

      {/* Request list */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container rounded-3xl shadow-ambient-sm p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-xl shrink-0" />
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-surface-container-low animate-pulse rounded-lg" />
                  <div className="h-3 w-32 bg-surface-container-low animate-pulse rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 bg-surface-container-low animate-pulse rounded-full" />
                <div className="h-6 w-20 bg-surface-container-low animate-pulse rounded-full" />
              </div>
            </div>
            <div className="h-4 w-full bg-surface-container-low animate-pulse rounded-lg" />
            <div className="h-4 w-2/3 bg-surface-container-low animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}
