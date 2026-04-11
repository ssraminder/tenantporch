import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/currency";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";
import Link from "next/link";

export default async function AdminProperties() {
  const supabase = await createClient();

  // Get authenticated user and rp_user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  // Get landlord profile with plan info
  const { data: landlordProfile } = await supabase
    .from("rp_landlord_profiles")
    .select("id, property_count, subscription_status, plan_id, rp_plans(id, slug, name, max_properties)")
    .eq("user_id", rpUser!.id)
    .single();

  // Supabase returns joined rows as arrays; extract the first element
  const planRaw = landlordProfile?.rp_plans;
  const plan = (Array.isArray(planRaw) ? planRaw[0] : planRaw) as {
    id: string;
    slug: string;
    name: string;
    max_properties: number | null;
  } | null;

  const isFreePlan = plan?.slug === "free";
  const maxProperties = plan?.max_properties ?? null;
  const propertyCount = landlordProfile?.property_count ?? 0;
  const atLimit = maxProperties !== null && propertyCount >= maxProperties;

  // Fetch all properties for this landlord
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id, address_line1, address_line2, city, province_state, postal_code, unit_description, status, monthly_rent, created_at")
    .eq("landlord_id", landlordProfile!.id)
    .order("created_at", { ascending: false });

  // Fetch active/draft leases for all properties with tenant counts
  const propertyIds = (properties ?? []).map((p) => p.id);

  let leasesByProperty: Record<
    string,
    {
      status: string;
      start_date: string;
      end_date: string | null;
      monthly_rent: number;
      currency_code: string;
      tenant_count: number;
    }
  > = {};

  if (propertyIds.length > 0) {
    const { data: leases } = await supabase
      .from("rp_leases")
      .select("id, property_id, start_date, end_date, monthly_rent, status, currency_code")
      .in("property_id", propertyIds)
      .in("status", ["active", "draft"])
      .order("start_date", { ascending: false });

    if (leases && leases.length > 0) {
      // Get tenant counts for these leases
      const leaseIds = leases.map((l) => l.id);
      const { data: leaseTenants } = await supabase
        .from("rp_lease_tenants")
        .select("lease_id")
        .in("lease_id", leaseIds);

      const tenantCountByLease: Record<string, number> = {};
      (leaseTenants ?? []).forEach((lt) => {
        tenantCountByLease[lt.lease_id] = (tenantCountByLease[lt.lease_id] ?? 0) + 1;
      });

      // Keep only the most recent lease per property (first encountered due to ordering)
      for (const lease of leases) {
        if (!leasesByProperty[lease.property_id]) {
          leasesByProperty[lease.property_id] = {
            status: lease.status,
            start_date: lease.start_date,
            end_date: lease.end_date,
            monthly_rent: lease.monthly_rent,
            currency_code: lease.currency_code,
            tenant_count: tenantCountByLease[lease.id] ?? 0,
          };
        }
      }
    }
  }

  const hasProperties = properties && properties.length > 0;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-headline text-2xl font-bold text-primary">
          Properties
        </h1>

        <div className="flex items-center gap-3">
          {/* Overage warning for paid plans */}
          {!isFreePlan && atLimit && (
            <div className="flex items-center gap-1.5 text-xs text-on-secondary-fixed-variant bg-secondary-fixed/30 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-sm">warning</span>
              Overage charges may apply
            </div>
          )}

          {isFreePlan && atLimit ? (
            <div className="relative group">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-semibold cursor-not-allowed select-none"
                aria-disabled="true"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Property
              </span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-inverse-surface text-inverse-on-surface text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Upgrade to add more properties
              </div>
            </div>
          ) : (
            <Link
              href="/admin/properties/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Property
            </Link>
          )}
        </div>
      </div>

      {/* Property count context */}
      {maxProperties !== null && hasProperties && (
        <p className="text-sm text-on-surface-variant -mt-4">
          {propertyCount} of {maxProperties} properties on the{" "}
          <span className="font-semibold">{plan?.name ?? "current"}</span> plan
        </p>
      )}

      {/* Property Cards Grid */}
      {hasProperties ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => {
            const lease = leasesByProperty[property.id];
            const leaseDisplay = lease
              ? getLeaseDisplayStatus({
                  status: lease.status,
                  start_date: lease.start_date,
                  end_date: lease.end_date,
                })
              : null;

            return (
              <Link
                key={property.id}
                href={`/admin/properties/${property.id}`}
                className="group bg-surface-container-lowest rounded-2xl shadow-ambient-sm hover:shadow-ambient transition-shadow overflow-hidden"
              >
                {/* Status accent bar */}
                <div
                  className={`h-1 ${
                    property.status === "occupied"
                      ? "bg-tertiary-fixed-dim"
                      : property.status === "maintenance"
                        ? "bg-error"
                        : "bg-secondary-fixed-dim"
                  }`}
                />

                <div className="p-5 space-y-4">
                  {/* Address and status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-headline font-bold text-on-surface truncate">
                        {property.address_line1}
                      </h3>
                      {property.unit_description && (
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {property.unit_description}
                        </p>
                      )}
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        {property.city}, {property.province_state}
                      </p>
                    </div>
                    <StatusBadge status={property.status} />
                  </div>

                  {/* Rent */}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">
                      payments
                    </span>
                    <span className="text-sm font-semibold text-on-surface">
                      {formatCurrency(property.monthly_rent)} / mo
                    </span>
                  </div>

                  {/* Lease info */}
                  <div className="bg-surface-container-low rounded-xl px-4 py-3 space-y-2">
                    {lease && leaseDisplay ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-on-surface-variant">
                            Lease
                          </span>
                          <StatusBadge status={leaseDisplay.key} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">
                            group
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {lease.tenant_count}{" "}
                            {lease.tenant_count === 1 ? "tenant" : "tenants"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant/60 text-sm">
                          gavel
                        </span>
                        <span className="text-xs text-on-surface-variant/60">
                          No active lease
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View detail arrow */}
                  <div className="flex items-center justify-end text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary-fixed/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-on-primary-fixed-variant">
              home_work
            </span>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            Add your first property
          </h2>
          <p className="text-sm text-on-surface-variant max-w-sm mb-8">
            Start managing your rental properties by adding your first listing.
            You can track leases, tenants, and maintenance all in one place.
          </p>
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Property
          </Link>
        </div>
      )}
    </section>
  );
}
