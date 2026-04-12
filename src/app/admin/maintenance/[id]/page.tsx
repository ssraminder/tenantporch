import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { MaintenanceStatusActions } from "@/components/shared/maintenance-status-actions";
import { MaintenancePhotosSection } from "@/components/shared/maintenance-photos-section";

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
  pest_control: "pest_control",
  landscaping: "park",
  cleaning: "cleaning_services",
  general: "handyman",
  other: "handyman",
};

type MaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  description: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string | null;
  rp_properties: { address_line1: string; city: string } | null;
  rp_users: { first_name: string; last_name: string; email: string } | null;
};

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <NotFound />;

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser) return <NotFound />;

  // Verify ownership via landlord property ids
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);

  if (propertyIds.length === 0) return <NotFound />;

  // Fetch the maintenance request with property and tenant info
  const { data: request } = await supabase
    .from("rp_maintenance_requests")
    .select(
      "*, rp_properties(address_line1, city), rp_users!rp_maintenance_requests_tenant_id_fkey(first_name, last_name, email)"
    )
    .eq("id", id)
    .single();

  if (!request) return <NotFound />;

  // Verify the request belongs to one of this landlord's properties
  if (!propertyIds.includes(request.property_id)) return <NotFound />;

  // Fetch maintenance photos
  const { data: photos } = await supabase
    .from("rp_maintenance_photos")
    .select("id, photo_url, caption, created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const req = request as unknown as MaintenanceRequest;
  const property = req.rp_properties;
  const tenant = req.rp_users;
  const urgencyStyle = URGENCY_STYLES[req.urgency] ?? URGENCY_STYLES.low;
  const categoryIcon = CATEGORY_ICONS[req.category] ?? CATEGORY_ICONS.general;

  return (
    <section className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Maintenance", href: "/admin/maintenance", icon: "handyman" },
          { label: req.title },
        ]}
      />

      {/* Header */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight truncate">
          {req.title}
        </h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <StatusBadge status={req.status} />
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgencyStyle}`}
          >
            {req.urgency}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            <span className="material-symbols-outlined text-xs">
              {categoryIcon}
            </span>
            {req.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              <h2 className="text-lg font-headline font-bold text-primary">
                Description
              </h2>
              {req.description ? (
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                  {req.description}
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant italic">
                  No description provided.
                </p>
              )}
            </div>
          </div>

          {/* Photos card */}
          <MaintenancePhotosSection
            requestId={req.id}
            initialPhotos={photos ?? []}
          />

          {/* Status Actions card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <MaintenanceStatusActions
                requestId={req.id}
                currentStatus={req.status}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property info card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-primary font-headline">
                Property
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-primary-fixed-variant">
                    apartment
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {property?.address_line1 ?? "Unknown"}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {property?.city ?? ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant info card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-primary font-headline">
                Tenant
              </h3>
              {tenant ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-fixed-variant">
                      person
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {tenant.first_name} {tenant.last_name}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {tenant.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-lg">
                    person_off
                  </span>
                  <p className="text-sm">No tenant assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-primary font-headline">
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">
                    schedule
                  </span>
                  <div>
                    <p className="text-xs text-on-surface-variant">Created</p>
                    <p className="text-sm font-semibold text-on-surface">
                      <DateDisplay date={req.created_at} format="long" />
                    </p>
                  </div>
                </div>

                {req.updated_at && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">
                      update
                    </span>
                    <div>
                      <p className="text-xs text-on-surface-variant">
                        Last Updated
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        <DateDisplay date={req.updated_at} format="long" />
                      </p>
                    </div>
                  </div>
                )}

                {req.scheduled_date && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-primary-fixed-variant text-lg">
                      event
                    </span>
                    <div>
                      <p className="text-xs text-on-surface-variant">
                        Scheduled
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        <DateDisplay date={req.scheduled_date} format="long" />
                      </p>
                    </div>
                  </div>
                )}

                {req.completed_date && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary text-lg">
                      check_circle
                    </span>
                    <div>
                      <p className="text-xs text-on-surface-variant">
                        Completed
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        <DateDisplay date={req.completed_date} format="long" />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/maintenance"
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            arrow_back
          </span>
        </Link>
        <h1 className="text-2xl font-headline font-extrabold text-primary tracking-tight">
          Maintenance Request
        </h1>
      </div>
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-error-container/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-on-error-container">
            search_off
          </span>
        </div>
        <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
          Request not found
        </h2>
        <p className="text-sm text-on-surface-variant max-w-sm">
          This maintenance request doesn&apos;t exist or you don&apos;t have
          permission to view it.
        </p>
        <Link
          href="/admin/maintenance"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Maintenance
        </Link>
      </div>
    </section>
  );
}
