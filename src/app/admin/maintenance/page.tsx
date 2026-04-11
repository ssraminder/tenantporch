import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import Link from "next/link";

const URGENCY_STYLES: Record<string, string> = {
  low: "bg-primary-fixed/30 text-on-primary-fixed-variant",
  medium: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  high: "bg-error-container text-on-error-container",
  emergency: "bg-error text-on-error",
};

const CATEGORY_ICONS: Record<string, string> = {
  plumbing: "plumbing",
  electrical: "electrical_services",
  appliance: "kitchen",
  hvac: "thermostat",
  structural: "foundation",
  pest: "pest_control",
  general: "handyman",
};

const COLUMN_CONFIG: {
  key: string;
  label: string;
  accent: string;
}[] = [
  { key: "submitted", label: "Submitted", accent: "bg-secondary" },
  { key: "acknowledged", label: "Acknowledged", accent: "bg-primary" },
  { key: "in_progress", label: "In Progress", accent: "bg-secondary-fixed-dim" },
  { key: "scheduled", label: "Scheduled", accent: "bg-tertiary" },
  { key: "completed", label: "Completed", accent: "bg-tertiary-fixed-dim" },
];

type MaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  created_at: string;
  rp_properties: { address_line1: string; city: string } | null;
  rp_users: { first_name: string; last_name: string } | null;
};

export default async function AdminMaintenance() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  // Get all properties for this landlord
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id")
    .eq("landlord_id", rpUser!.id);

  const propertyIds = (properties ?? []).map((p) => p.id);

  // Fetch maintenance requests with property and tenant info
  let requests: MaintenanceRequest[] = [];
  if (propertyIds.length > 0) {
    const { data } = await supabase
      .from("rp_maintenance_requests")
      .select(
        "id, title, category, urgency, status, scheduled_date, completed_date, created_at, rp_properties(address_line1, city), rp_users!rp_maintenance_requests_tenant_id_fkey(first_name, last_name)"
      )
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });

    requests = (data ?? []) as unknown as MaintenanceRequest[];
  }

  // Group requests by status column
  const columns: Record<string, MaintenanceRequest[]> = {
    submitted: [],
    acknowledged: [],
    in_progress: [],
    scheduled: [],
    completed: [],
  };

  for (const req of requests) {
    const key = req.status;
    if (key === "cancelled") continue;
    if (columns[key]) {
      // For completed, only keep the last 5
      if (key === "completed" && columns[key].length >= 5) continue;
      columns[key].push(req);
    }
  }

  // Stats
  const totalCount = requests.filter((r) => r.status !== "cancelled").length;
  const openCount = requests.filter(
    (r) => !["completed", "cancelled"].includes(r.status)
  ).length;
  const completedCount = requests.filter((r) => r.status === "completed").length;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-headline text-2xl font-bold text-primary">
          Maintenance
        </h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest shadow-ambient-sm">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">
              handyman
            </span>
            <span className="text-sm font-semibold text-on-surface">
              {totalCount}
            </span>
            <span className="text-xs text-on-surface-variant">total</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest shadow-ambient-sm">
            <span className="material-symbols-outlined text-secondary text-lg">
              pending_actions
            </span>
            <span className="text-sm font-semibold text-on-surface">
              {openCount}
            </span>
            <span className="text-xs text-on-surface-variant">open</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest shadow-ambient-sm">
            <span className="material-symbols-outlined text-tertiary text-lg">
              check_circle
            </span>
            <span className="text-sm font-semibold text-on-surface">
              {completedCount}
            </span>
            <span className="text-xs text-on-surface-variant">completed</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {totalCount === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary-fixed/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-on-primary-fixed-variant">
              check_circle
            </span>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            No maintenance requests
          </h2>
          <p className="text-sm text-on-surface-variant max-w-sm">
            When tenants submit maintenance requests, they will appear here
            organized by status.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="grid grid-cols-[repeat(5,minmax(280px,1fr))] lg:grid-cols-5 gap-4 min-w-[1400px] lg:min-w-0">
            {COLUMN_CONFIG.map((col) => {
              const items = columns[col.key] ?? [];
              return (
                <div key={col.key} className="flex flex-col gap-3">
                  {/* Column header */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-lowest shadow-ambient-sm">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.accent}`} />
                    <h3 className="font-headline font-bold text-sm text-on-surface">
                      {col.label}
                    </h3>
                    <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
                      {items.length}
                    </span>
                  </div>

                  {/* Column cards */}
                  <div className="flex flex-col gap-3">
                    {items.length === 0 ? (
                      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient-sm text-center">
                        <p className="text-xs text-on-surface-variant">
                          No requests
                        </p>
                      </div>
                    ) : (
                      items.map((req) => {
                        const property = req.rp_properties as any;
                        const tenant = req.rp_users as any;
                        const urgencyStyle =
                          URGENCY_STYLES[req.urgency] ?? URGENCY_STYLES.low;
                        const categoryIcon =
                          CATEGORY_ICONS[req.category] ?? CATEGORY_ICONS.general;

                        return (
                          <div
                            key={req.id}
                            className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm hover:shadow-ambient transition-shadow overflow-hidden"
                          >
                            {/* Urgency accent bar */}
                            <div
                              className={`h-1 ${
                                req.urgency === "emergency"
                                  ? "bg-error"
                                  : req.urgency === "high"
                                    ? "bg-error-container"
                                    : req.urgency === "medium"
                                      ? "bg-secondary"
                                      : "bg-primary-fixed-dim"
                              }`}
                            />

                            <div className="p-4 space-y-3">
                              {/* Title */}
                              <h4 className="text-sm font-semibold text-on-surface leading-snug line-clamp-2">
                                {req.title}
                              </h4>

                              {/* Property address */}
                              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                                <span className="material-symbols-outlined text-xs">
                                  location_on
                                </span>
                                <span className="truncate">
                                  {property?.address_line1 ?? "Unknown"}
                                  {property?.city ? `, ${property.city}` : ""}
                                </span>
                              </div>

                              {/* Tenant name */}
                              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                                <span className="material-symbols-outlined text-xs">
                                  person
                                </span>
                                <span className="truncate">
                                  {tenant
                                    ? `${tenant.first_name} ${tenant.last_name}`
                                    : "Unknown tenant"}
                                </span>
                              </div>

                              {/* Category and urgency badges */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                  <span className="material-symbols-outlined text-xs">
                                    {categoryIcon}
                                  </span>
                                  {req.category}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgencyStyle}`}
                                >
                                  {req.urgency}
                                </span>
                              </div>

                              {/* Dates */}
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-on-surface-variant">
                                  <DateDisplay
                                    date={req.created_at}
                                    format="relative"
                                  />
                                </span>

                                {req.status === "scheduled" &&
                                  req.scheduled_date && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-on-primary-fixed-variant">
                                      <span className="material-symbols-outlined text-xs">
                                        event
                                      </span>
                                      <DateDisplay
                                        date={req.scheduled_date}
                                        format="short"
                                      />
                                    </span>
                                  )}

                                {req.status === "completed" &&
                                  req.completed_date && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-on-tertiary-fixed-variant">
                                      <span className="material-symbols-outlined text-xs">
                                        check_circle
                                      </span>
                                      <DateDisplay
                                        date={req.completed_date}
                                        format="short"
                                      />
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
