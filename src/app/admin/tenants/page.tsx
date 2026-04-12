import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";
import { TenantsList } from "./tenants-list";

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
        "id, lease_id, user_id, role, is_primary_contact, rp_users!inner(id, first_name, last_name, email, phone, id_document_status, stripe_identity_status)"
      )
      .in("lease_id", leaseIds);
    leaseTenantRows = ltData ?? [];
  }

  // Fetch active addendums for all leases in bulk
  const todayStr = new Date().toISOString().split("T")[0];
  let addendumsByLease: Record<string, number> = {};
  if (leaseIds.length > 0) {
    const { data: addendumData } = await supabase
      .from("rp_addendums")
      .select("lease_id, additional_rent_amount, effective_from, effective_to")
      .in("lease_id", leaseIds)
      .eq("status", "signed")
      .lte("effective_from", todayStr);

    for (const a of addendumData ?? []) {
      if (!a.effective_to || a.effective_to >= todayStr) {
        addendumsByLease[a.lease_id] = (addendumsByLease[a.lease_id] ?? 0) + Number(a.additional_rent_amount ?? 0);
      }
    }
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
      idDocumentStatus: tenantUser.id_document_status ?? null,
      stripeIdentityStatus: tenantUser.stripe_identity_status ?? null,
      leaseId: lt.lease_id,
      leaseStatus: displayStatus,
      leaseStartDate: lease?.start_date ?? null,
      leaseEndDate: lease?.end_date ?? null,
      monthlyRent: (lease?.monthly_rent ?? 0) + (addendumsByLease[lt.lease_id] ?? 0),
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

      {/* Tenant List (client component with search) */}
      <TenantsList tenants={tenantRows} />
    </section>
  );
}
