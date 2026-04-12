import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { MaintenancePhotosSection } from "@/components/shared/maintenance-photos-section";

const STATUS_TIMELINE = [
  { key: "submitted", label: "Submitted", icon: "check" },
  { key: "acknowledged", label: "Acknowledged", icon: "visibility" },
  { key: "in_progress", label: "In Progress", icon: "sync" },
  { key: "scheduled", label: "Scheduled", icon: "calendar_today" },
  { key: "completed", label: "Completed", icon: "check_circle" },
];

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

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id, first_name, last_name")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return notFound();

  // Fetch request (verify tenant owns it)
  const { data: request } = await supabase
    .from("rp_maintenance_requests")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", rpUser.id)
    .single();

  if (!request) return notFound();

  // Fetch photos
  const { data: photos } = await supabase
    .from("rp_maintenance_photos")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  // Fetch property info
  const { data: property } = await supabase
    .from("rp_properties")
    .select("address_line1, city, province_state")
    .eq("id", request.property_id)
    .single();

  // Determine status index for timeline
  const currentStatusIndex = STATUS_TIMELINE.findIndex(
    (s) => s.key === request.status
  );

  return (
    <section className="space-y-6">
      {/* Back link */}
      <Link
        href="/tenant/maintenance"
        className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-secondary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Maintenance
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Case #{id.slice(0, 8).toUpperCase()}
            </span>
            <span className="w-1 h-1 bg-outline-variant rounded-full" />
            <span className="text-xs font-medium text-on-surface-variant">
              {property?.address_line1}, {property?.city}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-black text-primary tracking-tight">
            {request.title}
          </h1>
        </div>
        <StatusBadge status={request.status} className="self-start md:self-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status Timeline */}
          <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl overflow-x-auto">
            {STATUS_TIMELINE.map((step, i) => {
              const isComplete = i <= currentStatusIndex;
              const isCurrent = i === currentStatusIndex;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-surface-bright flex-shrink-0 ${
                      isComplete
                        ? isCurrent
                          ? "bg-secondary text-white"
                          : "bg-tertiary text-white"
                        : "bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-xs"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {step.icon}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold whitespace-nowrap ${
                      isComplete ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {step.label}
                  </span>
                  {i < STATUS_TIMELINE.length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${
                        i < currentStatusIndex ? "bg-tertiary" : "bg-surface-variant"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Description */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient-sm">
            <h3 className="font-headline font-bold text-primary mb-3">
              Description
            </h3>
            <p className="text-sm text-on-surface leading-relaxed">
              {request.description}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-4 font-bold uppercase">
              Submitted <DateDisplay date={request.created_at} format="long" />
            </p>
          </div>

          {/* Photos: gallery + upload */}
          <MaintenancePhotosSection
            requestId={id}
            initialPhotos={(photos ?? []).map((p) => ({
              id: p.id,
              photo_url: p.photo_url,
              caption: p.caption,
              created_at: p.created_at,
            }))}
          />

          {/* Contact landlord prompt */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary-fixed-variant text-lg">chat</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface mb-0.5">Need to provide an update?</p>
              <p className="text-xs text-on-surface-variant">Send your landlord a message about this request.</p>
            </div>
            <Link
              href="/tenant/messages/new"
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Message
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient-sm">
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
              Request Info
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-on-surface-variant mb-1">Category</p>
                <p className="text-sm font-bold text-primary capitalize">
                  {request.category}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-1">Urgency</p>
                <p className="text-sm font-bold capitalize text-secondary">
                  {request.urgency}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-1">
                  Province Compliance
                </p>
                <span className="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                  AB - RTA Section 20
                </span>
              </div>
              {request.assigned_to && (
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">
                    Assigned To
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {request.assigned_to}
                  </p>
                </div>
              )}
              {request.scheduled_date && (
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">
                    Scheduled Date
                  </p>
                  <DateDisplay
                    date={request.scheduled_date}
                    format="long"
                    className="text-sm font-bold text-primary"
                  />
                </div>
              )}
              {request.estimated_cost && (
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">
                    Estimated Cost
                  </p>
                  <p className="text-sm font-bold text-primary">
                    ${Number(request.estimated_cost).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {request.landlord_notes && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient-sm border-l-4 border-secondary">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                Landlord Notes
              </h4>
              <p className="text-sm text-on-surface leading-relaxed">
                {request.landlord_notes}
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
