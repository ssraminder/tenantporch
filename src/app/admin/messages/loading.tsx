export default function AdminMessagesLoading() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-8 w-32 bg-surface-container-low animate-pulse rounded-xl" />
        <div className="h-10 w-36 bg-surface-container-low animate-pulse rounded-xl" />
      </div>

      {/* Message list */}
      <div className="bg-surface-container rounded-3xl shadow-ambient-sm divide-y divide-outline-variant">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-5">
            {/* Icon circle */}
            <div className="h-10 w-10 bg-surface-container-low animate-pulse rounded-full shrink-0" />

            {/* Message content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-surface-container-low animate-pulse rounded-lg" />
                <div className="h-3 w-20 bg-surface-container-low animate-pulse rounded-lg" />
              </div>
              <div className="h-4 w-3/4 bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-3 w-full bg-surface-container-low animate-pulse rounded-lg" />
              <div className="h-3 w-2/3 bg-surface-container-low animate-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
