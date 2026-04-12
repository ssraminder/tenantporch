export default function AdminMaintenanceLoading() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-8 w-40 bg-surface-container-low animate-pulse rounded-xl" />
        <div className="h-10 w-36 bg-surface-container-low animate-pulse rounded-xl" />
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="space-y-3">
            {/* Column header */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-surface-container-low animate-pulse rounded-full" />
              <div className="h-5 w-24 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-5 w-6 bg-surface-container-low animate-pulse rounded-full" />
            </div>

            {/* Cards in column */}
            {Array.from({ length: 2 }).map((_, card) => (
              <div
                key={card}
                className="bg-surface-container rounded-3xl shadow-ambient-sm p-4 space-y-3"
              >
                <div className="h-4 w-3/4 bg-surface-container-low animate-pulse rounded-lg" />
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-surface-container-low animate-pulse rounded-full" />
                  <div className="h-5 w-14 bg-surface-container-low animate-pulse rounded-full" />
                </div>
                <div className="h-3 w-full bg-surface-container-low animate-pulse rounded-lg" />
                <div className="h-3 w-2/3 bg-surface-container-low animate-pulse rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
