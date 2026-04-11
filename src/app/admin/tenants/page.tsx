import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";
import { formatCurrency } from "@/lib/currency";

export default async function AdminTenantsPage() {
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

  // 1. Get all landlord's properties
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id, address_line1, city")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyMap = (properties ?? []).reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<string, { id: string; address_line1: string; city: string }>
  );

  // 2. Get all leases for those properties
  let leases: {
    id: string;
    property_id: string;
    start_date: string;
    end_date: string | null;
    monthly_rent: number;
    status: string;
    currency_code: string;
  }[] = [];

  if (propertyIds.length > 0) {
    const { data: leaseData } = await supabase
      .from("rp_leases")
      .select("id, property_id, start_date, end_date, monthly_rent, status, currency_code")
      .in("property_id", propertyIds);
    leases = leaseData ?? [];
  }

  const leaseIds = leases.map((l) => l.id);
  const leaseMap = leases.reduce(
    (acc, l) => {
      acc[l.id] = l;
      return acc;
    },
    {} as Record<string, (typeof leases)[0]>
  );

  // 3. Get all lease_tenants joined with rp_users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leaseTenantRows: any[] = [];

  if (leaseIds.length > 0) {
    const { data: ltData } = await supabase
      .from("rp_lease_tenants")
      .select(
        "id, lease_id, user_id, role, is_primary_contact, rp_users!inner(id, first_name, last_name, email, phone)"
      )
      .in("lease_id", leaseIds);
    leaseTenantRows = ltData ?? [];
  }

  // Build enriched tenant list
  const tenantRows = leaseTenantRows.map((lt) => {
    const lease = leaseMap[lt.lease_id];
    const property = lease ? propertyMap[lease.property_id] : null;
    const displayStatus = lease
      ? getLeaseDisplayStatus(lease)
      : { label: "Unknown", key: "unknown" };

    // Supabase returns the joined relation as an object (single) when using !inner
    const tenantUser = lt.rp_users;

    return {
      leaseTenantId: lt.id,
      userId: tenantUser.id,
      firstName: tenantUser.first_name,
      lastName: tenantUser.last_name,
      email: tenantUser.email,
      phone: tenantUser.phone,
      role: lt.role,
      isPrimaryContact: lt.is_primary_contact,
      leaseId: lt.lease_id,
      leaseStatus: displayStatus,
      leaseStartDate: lease?.start_date ?? null,
      leaseEndDate: lease?.end_date ?? null,
      monthlyRent: lease?.monthly_rent ?? 0,
      currencyCode: lease?.currency_code ?? "CAD",
      propertyAddress: property
        ? `${property.address_line1}, ${property.city}`
        : "No property",
    };
  });

  const tenantCount = tenantRows.length;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Tenants
          </h1>
          {tenantCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant text-xs font-bold">
              {tenantCount}
            </span>
          )}
        </div>
        <Link
          href="/admin/tenants/invite"
          className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Invite Tenant
        </Link>
      </div>

      {/* Tenant List */}
      {tenantCount === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
            group
          </span>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">
            No Tenants Yet
          </h2>
          <p className="text-on-surface-variant mb-6">
            Once you add properties and leases, your tenants will appear here.
          </p>
          <Link
            href="/admin/tenants/invite"
            className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Invite Your First Tenant
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tenantRows.map((tenant) => (
            <Link
              key={tenant.leaseTenantId}
              href={`/admin/tenants/${tenant.userId}`}
              className="block bg-surface-container-lowest p-5 md:p-6 rounded-xl shadow-ambient-sm hover:bg-surface-bright transition-colors group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-on-primary-fixed-variant">
                    {tenant.firstName?.[0]?.toUpperCase() ?? ""}
                    {tenant.lastName?.[0]?.toUpperCase() ?? ""}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row: name + badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-headline font-bold text-primary truncate">
                      {tenant.firstName} {tenant.lastName}
                    </h3>
                    <StatusBadge status={tenant.leaseStatus.key} />
                    {tenant.role === "permitted_occupant" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant">
                        Occupant
                      </span>
                    )}
                    {tenant.isPrimaryContact && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed/30 text-on-tertiary-fixed-variant">
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant mb-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">mail</span>
                      {tenant.email}
                    </span>
                    {tenant.phone && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">phone</span>
                        {tenant.phone}
                      </span>
                    )}
                  </div>

                  {/* Property + Lease info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-xs">apartment</span>
                      {tenant.propertyAddress}
                    </span>
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-xs">payments</span>
                      {formatCurrency(tenant.monthlyRent, tenant.currencyCode)}/mo
                    </span>
                    {tenant.leaseStartDate && (
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-xs">event</span>
                        <DateDisplay date={tenant.leaseStartDate} format="short" />
                        {tenant.leaseEndDate && (
                          <>
                            <span className="mx-0.5">&ndash;</span>
                            <DateDisplay date={tenant.leaseEndDate} format="short" />
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors self-center">
                  chevron_right
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
