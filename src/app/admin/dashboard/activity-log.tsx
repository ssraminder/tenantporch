import { DateDisplay } from "@/components/shared/date-display";

export interface ActivityItem {
  id: string;
  type:
    | "payment"
    | "maintenance"
    | "message"
    | "lease"
    | "document"
    | "tenant";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export function ActivityLog({ items }: { items: ActivityItem[] }) {
  const displayed = items.slice(0, 10);

  return (
    <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
      {/* Header */}
      <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">history</span>
        <h3 className="font-headline font-bold text-lg">Recent Activity</h3>
      </div>

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="px-8 py-16 text-center">
          <span className="material-symbols-outlined text-outline-variant text-5xl mb-4 block">
            event_note
          </span>
          <p className="text-sm text-on-surface-variant font-medium">
            No recent activity to show
          </p>
          <p className="text-xs text-outline-variant mt-1">
            Activity from payments, maintenance, and messages will appear here.
          </p>
        </div>
      )}

      {/* Timeline */}
      {displayed.length > 0 && (
        <div className="px-6 md:px-8 py-4">
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-5 top-6 bottom-6 w-px bg-outline-variant/20" />

            <div className="space-y-0">
              {displayed.map((item) => (
                <div
                  key={item.id}
                  className="relative flex items-start gap-4 py-3 group"
                >
                  {/* Icon circle — sits on top of the vertical line */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105`}
                  >
                    <span className="material-symbols-outlined text-white text-sm">
                      {item.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-on-surface leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed truncate">
                      {item.description}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 pt-1">
                    <span className="text-xs text-outline-variant whitespace-nowrap">
                      <DateDisplay date={item.timestamp} format="relative" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
