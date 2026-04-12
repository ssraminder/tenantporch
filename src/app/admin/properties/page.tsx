import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PropertiesList } from "./properties-list";

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
    .eq("landlord_id", rpUser!.id)
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

      {/* Property Cards Grid (client component with search) */}
      <PropertiesList
        properties={properties ?? []}
        leasesByProperty={leasesByProperty}
      />
    </section>
  );
}
