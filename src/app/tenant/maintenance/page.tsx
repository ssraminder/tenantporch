import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";

const CATEGORY_ICON: Record<string, string> = {
  plumbing: "plumbing",
  electrical: "electrical_services",
  appliance: "kitchen",
  hvac: "thermostat",
  structural: "foundation",
  pest: "pest_control",
  general: "handyman",
};

const URGENCY_STYLE: Record<string, string> = {
  low: "text-on-surface-variant",
  medium: "text-secondary",
  high: "text-error",
  emergency: "text-error font-black",
};

export default async function MaintenancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // Get lease to find property — include active and draft (upcoming) leases
  const { data: leaseLinks } = await supabase
    .from("rp_lease_tenants")
    .select("lease_id, rp_leases!inner(id, status)")
    .eq("user_id", rpUser.id)
    .in("rp_leases.status", ["active", "draft"]);

  const sortedLinks = (leaseLinks ?? []).sort((a, b) => {
    const aStatus = (a as any).rp_leases?.status ?? "";
    const bStatus = (b as any).rp_leases?.status ?? "";
    if (aStatus === "active" && bStatus !== "active") return -1;
    if (bStatus === "active" && aStatus !== "active") return 1;
    return 0;
  });
  const leaseLink = sortedLinks[0] ?? null;

  let propertyId: string | null = null;
  if (leaseLink) {
    const { data: lease } = await supabase
      .from("rp_leases")
      .select("property_id")
      .eq("id", leaseLink.lease_id)
      .single();
    propertyId = lease?.property_id ?? null;
  }

  // Fetch maintenance requests
  const { data: requests } = await supabase
    .from("rp_maintenance_requests")
    .select("*")
    .eq("tenant_id", rpUser.id)
    .order("created_at", { ascending: false });

  // Fetch photos for all requests
  const requestIds = (requests ?? []).map((r) => r.id);
  const { data: photos } = requestIds.length > 0
    ? await supabase
        .from("rp_maintenance_photos")
        .select("*")
        .in("request_id", requestIds)
        .eq("photo_type", "initial")
    : { data: [] };

  const photosByRequest = (photos ?? []).reduce(
    (acc, p) => {
      if (!acc[p.request_id]) acc[p.request_id] = [];
      acc[p.request_id].push(p);
      return acc;
    },
    {} as Record<string, typeof photos>
  );

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Maintenance Hub
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Submit and track repair requests
          </p>
        </div>
        <Link
          href="/tenant/maintenance/new"
          className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          New Request
        </Link>
      </div>

      {/* Request List */}
      {(requests ?? []).length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
            handyman
          </span>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">
            No Maintenance Requests
          </h2>
          <p className="text-on-surface-variant mb-6">
            Everything looking good! Submit a request if you need repairs.
          </p>
          <Link
            href="/tenant/maintenance/new"
            className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Submit Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(requests ?? []).map((req) => {
            const reqPhotos = photosByRequest[req.id] ?? [];
            return (
              <Link
                key={req.id}
                href={`/tenant/maintenance/${req.id}`}
                className="block bg-surface-container-lowest p-5 md:p-6 rounded-xl shadow-ambient-sm border-l-4 border-secondary hover:bg-surface-bright transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Photo thumbnail */}
                  {reqPhotos.length > 0 ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                      <img
                        src={reqPhotos[0].photo_url}
                        alt={req.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                        {CATEGORY_ICON[req.category] ?? "handyman"}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-headline font-bold text-primary truncate">
                        {req.title}
                      </h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
                      {req.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="px-2 py-0.5 bg-surface-container-low rounded-full font-bold text-on-surface-variant capitalize">
                        {req.category}
                      </span>
                      <span className={URGENCY_STYLE[req.urgency] ?? ""}>
                        {req.urgency === "high" || req.urgency === "emergency" ? (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                              priority_high
                            </span>
                            {req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
                          </span>
                        ) : (
                          req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)
                        )}
                      </span>
                      <DateDisplay
                        date={req.created_at}
                        format="relative"
                        className="text-on-surface-variant"
                      />
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors self-center">
                    chevron_right
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
