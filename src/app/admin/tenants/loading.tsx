export default function AdminTenantsLoading() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-8 w-28 bg-surface-container-low animate-pulse rounded-xl" />
        <div className="h-10 w-32 bg-surface-container-low animate-pulse rounded-xl" />
      </div>

      {/* Search bar */}
      <div className="h-12 w-full max-w-sm bg-surface-container-low animate-pulse rounded-xl" />

      {/* Tenant list */}
      <div className="bg-surface-container rounded-3xl shadow-ambient-sm divide-y divide-outline-variant">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5">
            {/* Avatar */}
            <div className="h-11 w-11 bg-surface-container-low animate-pulse rounded-full shrink-0" />

            {/* Name + property */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-3 w-56 bg-surface-container-low animate-pulse rounded-lg" />
            </div>

            {/* Lease status */}
            <div className="h-6 w-20 bg-surface-container-low animate-pulse rounded-full shrink-0" />

            {/* Rent amount */}
            <div className="h-5 w-24 bg-surface-container-low animate-pulse rounded-lg shrink-0 hidden sm:block" />
          </div>
        ))}
      </div>
    </section>
  );
}
