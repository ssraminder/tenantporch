import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { formatCurrency } from "@/lib/currency";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";

const METHOD_LABELS: Record<string, { label: string; icon: string }> = {
  card: { label: "Card", icon: "credit_card" },
  bank_transfer: { label: "Bank", icon: "account_balance" },
  e_transfer: { label: "e-Transfer", icon: "swap_horiz" },
  cash: { label: "Cash", icon: "payments" },
  cheque: { label: "Cheque", icon: "receipt" },
};

const URGENCY_STYLES: Record<string, string> = {
  low: "bg-primary-fixed/30 text-on-primary-fixed-variant",
  medium: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  high: "bg-error-container text-on-error-container",
  emergency: "bg-error text-on-error",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <NotFound />;

  // Fetch property and verify ownership
  const { data: property } = await supabase
    .from("rp_properties")
    .select(
      "id, landlord_id, address_line1, address_line2, city, province_state, postal_code, country_code, unit_description, sticker_number, has_separate_entrance, has_separate_mailbox, parking_spots, is_furnished, status, monthly_rent, created_at"
    )
    .eq("id", propertyId)
    .single();

  if (!property || property.landlord_id !== rpUser.id) return <NotFound />;

  // Fetch current lease (active or draft, prefer active)
  const { data: leases } = await supabase
    .from("rp_leases")
    .select(
      "id, lease_type, start_date, end_date, monthly_rent, currency_code, security_deposit, deposit_paid_date, utility_split_percent, internet_included, pad_enabled, pets_allowed, smoking_allowed, max_occupants, late_fee_type, late_fee_amount, status, created_at"
    )
    .eq("property_id", propertyId)
    .in("status", ["active", "draft"])
    .order("start_date", { ascending: false });

  const sortedLeases = [...(leases ?? [])].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return b.start_date.localeCompare(a.start_date);
  });

  const currentLease = sortedLeases[0] ?? null;
  const leaseDisplayStatus = currentLease
    ? getLeaseDisplayStatus(currentLease)
    : null;
  const currency = currentLease?.currency_code ?? "CAD";

  // Fetch tenants on the current lease
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leaseTenants: any[] = [];
  if (currentLease) {
    const { data: ltData } = await supabase
      .from("rp_lease_tenants")
      .select(
        "id, lease_id, role, is_primary_contact, rp_users!inner(id, first_name, last_name, email, phone)"
      )
      .eq("lease_id", currentLease.id);
    leaseTenants = ltData ?? [];
  }

  // Fetch recent payments (last 5) across all leases for this property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentPayments: any[] = [];
  {
    const { data: allPropertyLeases } = await supabase
      .from("rp_leases")
      .select("id")
      .eq("property_id", propertyId);

    const allLeaseIds = (allPropertyLeases ?? []).map((l) => l.id);

    if (allLeaseIds.length > 0) {
      const { data: paymentData } = await supabase
        .from("rp_payments")
        .select(
          "id, amount, status, payment_method, payment_for_month, created_at, currency_code, rp_users!rp_payments_tenant_id_fkey(first_name, last_name)"
        )
        .in("lease_id", allLeaseIds)
        .order("created_at", { ascending: false })
        .limit(5);
      recentPayments = paymentData ?? [];
    }
  }

  // Fetch maintenance history (last 5)
  const { data: maintenanceRequests } = await supabase
    .from("rp_maintenance_requests")
    .select(
      "id, title, category, urgency, status, created_at, rp_users!rp_maintenance_requests_tenant_id_fkey(first_name, last_name)"
    )
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch documents for this property
  const { data: documents } = await supabase
    .from("rp_documents")
    .select(
      "id, title, category, file_url, file_size, visible_to_tenant, created_at"
    )
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  const fullAddress = `${property.address_line1}${property.address_line2 ? `, ${property.address_line2}` : ""}, ${property.city}, ${property.province_state} ${property.postal_code}`;

  return (
    <section className="space-y-8">
      {/* Back Link */}
      <Link
        href="/admin/properties"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Properties
      </Link>

      {/* Property Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
                {property.address_line1}
              </h1>
              <StatusBadge status={property.status} />
            </div>
            {property.unit_description && (
              <p className="text-sm text-on-surface-variant mb-1">
                {property.unit_description}
              </p>
            )}
            <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                location_on
              </span>
              {fullAddress}
            </p>
          </div>

          <Link
            href={`/admin/properties/${propertyId}/edit`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Edit Property
          </Link>
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">info</span>
          <h2 className="font-headline font-bold text-xl">Property Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Separate Entrance
            </p>
            <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                {property.has_separate_entrance ? "check_circle" : "cancel"}
              </span>
              {property.has_separate_entrance ? "Yes" : "No"}
            </p>
          </div>

          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Separate Mailbox
            </p>
            <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                {property.has_separate_mailbox ? "check_circle" : "cancel"}
              </span>
              {property.has_separate_mailbox ? "Yes" : "No"}
            </p>
          </div>

          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Parking Spots
            </p>
            <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                local_parking
              </span>
              {property.parking_spots ?? 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Furnished
            </p>
            <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                {property.is_furnished ? "check_circle" : "cancel"}
              </span>
              {property.is_furnished ? "Yes" : "No"}
            </p>
          </div>

          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Sticker Number
            </p>
            <p className="text-sm font-semibold text-on-surface">
              {property.sticker_number ?? "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Monthly Rent
            </p>
            <p className="text-sm font-bold text-primary">
              {formatCurrency(property.monthly_rent)}
            </p>
          </div>
        </div>
      </div>

      {/* Current Lease Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              gavel
            </span>
            <h2 className="font-headline font-bold text-xl">Current Lease</h2>
          </div>
          {leaseDisplayStatus && (
            <StatusBadge status={leaseDisplayStatus.key} />
          )}
        </div>

        {currentLease ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {/* Lease Type */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Lease Type
              </p>
              <p className="text-sm font-semibold text-on-surface capitalize">
                {currentLease.lease_type.replace("_", " ")}
              </p>
            </div>

            {/* Dates */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Lease Period
              </p>
              <p className="text-sm font-semibold text-on-surface flex items-center gap-1">
                <DateDisplay date={currentLease.start_date} format="medium" />
                {currentLease.end_date && (
                  <>
                    <span className="text-on-surface-variant mx-1">
                      &ndash;
                    </span>
                    <DateDisplay
                      date={currentLease.end_date}
                      format="medium"
                    />
                  </>
                )}
              </p>
            </div>

            {/* Monthly Rent */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Monthly Rent
              </p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(currentLease.monthly_rent, currency)}
              </p>
            </div>

            {/* Security Deposit */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Security Deposit
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {currentLease.security_deposit
                  ? formatCurrency(currentLease.security_deposit, currency)
                  : "None"}
              </p>
              {currentLease.deposit_paid_date && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Paid{" "}
                  <DateDisplay
                    date={currentLease.deposit_paid_date}
                    format="medium"
                  />
                </p>
              )}
            </div>

            {/* Utility Split */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Utility Split
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {currentLease.utility_split_percent != null
                  ? `${currentLease.utility_split_percent}%`
                  : "N/A"}
              </p>
            </div>

            {/* PAD */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Pre-authorized Debit
              </p>
              <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  {currentLease.pad_enabled ? "check_circle" : "cancel"}
                </span>
                {currentLease.pad_enabled ? "Enabled" : "Disabled"}
              </p>
            </div>

            {/* Pets */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Pets Allowed
              </p>
              <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  {currentLease.pets_allowed ? "check_circle" : "cancel"}
                </span>
                {currentLease.pets_allowed ? "Yes" : "No"}
              </p>
            </div>

            {/* Smoking */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Smoking Allowed
              </p>
              <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  {currentLease.smoking_allowed ? "check_circle" : "cancel"}
                </span>
                {currentLease.smoking_allowed ? "Yes" : "No"}
              </p>
            </div>

            {/* Max Occupants */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Max Occupants
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {currentLease.max_occupants ?? "N/A"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              gavel
            </span>
            <p className="text-sm text-on-surface-variant mb-4">
              No active lease for this property
            </p>
            <Link
              href="/admin/leases/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Create Lease
            </Link>
          </div>
        )}
      </div>

      {/* Tenants Section */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">group</span>
          <h2 className="font-headline font-bold text-lg">Tenants</h2>
          {leaseTenants.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant text-xs font-bold ml-auto">
              {leaseTenants.length}
            </span>
          )}
        </div>

        {leaseTenants.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              person_off
            </span>
            <p className="text-sm text-on-surface-variant">
              No tenants on the current lease
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {leaseTenants.map((lt) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tenantUser = lt.rp_users as any;
              const initials = `${tenantUser.first_name?.[0]?.toUpperCase() ?? ""}${tenantUser.last_name?.[0]?.toUpperCase() ?? ""}`;
              return (
                <Link
                  key={lt.id}
                  href={`/admin/tenants/${tenantUser.id}`}
                  className="flex items-center gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-on-primary-fixed-variant">
                      {initials}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-primary truncate">
                        {tenantUser.first_name} {tenantUser.last_name}
                      </p>
                      {lt.is_primary_contact && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed/30 text-on-tertiary-fixed-variant">
                          Primary
                        </span>
                      )}
                      {lt.role === "permitted_occupant" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant">
                          Occupant
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          mail
                        </span>
                        {tenantUser.email}
                      </span>
                      {tenantUser.phone && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">
                            phone
                          </span>
                          {tenantUser.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            receipt_long
          </span>
          <h2 className="font-headline font-bold text-lg">Recent Payments</h2>
          <span className="text-xs text-on-surface-variant ml-auto">
            Last 5
          </span>
        </div>

        {recentPayments.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              payments
            </span>
            <p className="text-sm text-on-surface-variant">
              No payments recorded
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                    <th className="px-6 md:px-8 py-3">Date</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 pr-6 md:pr-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentPayments.map((payment) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const tenant = payment.rp_users as any;
                    const tenantName = tenant
                      ? `${tenant.first_name} ${tenant.last_name}`
                      : "Unknown";
                    const method =
                      METHOD_LABELS[payment.payment_method] ??
                      METHOD_LABELS.card;
                    return (
                      <tr
                        key={payment.id}
                        className="hover:bg-surface-container-low transition-colors"
                      >
                        <td className="px-6 md:px-8 py-4 text-sm text-on-surface">
                          <DateDisplay
                            date={payment.created_at}
                            format="medium"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-primary">
                          {tenantName}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-on-surface">
                          {formatCurrency(
                            Number(payment.amount ?? 0),
                            payment.currency_code ?? "CAD"
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">
                              {method.icon}
                            </span>
                            {method.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 pr-6 md:pr-8">
                          <StatusBadge status={payment.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-outline-variant/10">
              {recentPayments.map((payment) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tenant = payment.rp_users as any;
                const tenantName = tenant
                  ? `${tenant.first_name} ${tenant.last_name}`
                  : "Unknown";
                const method =
                  METHOD_LABELS[payment.payment_method] ?? METHOD_LABELS.card;
                return (
                  <div key={payment.id} className="px-6 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-on-surface">
                        {formatCurrency(
                          Number(payment.amount ?? 0),
                          payment.currency_code ?? "CAD"
                        )}
                      </span>
                      <StatusBadge status={payment.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                      <span className="font-medium text-primary">
                        {tenantName}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          event
                        </span>
                        <DateDisplay
                          date={payment.created_at}
                          format="short"
                        />
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          {method.icon}
                        </span>
                        {method.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Maintenance History */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            handyman
          </span>
          <h2 className="font-headline font-bold text-lg">
            Maintenance History
          </h2>
          <span className="text-xs text-on-surface-variant ml-auto">
            Last 5
          </span>
        </div>

        {(maintenanceRequests ?? []).length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              check_circle
            </span>
            <p className="text-sm text-on-surface-variant">
              No maintenance requests
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {(maintenanceRequests ?? []).map((req) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const reqTenant = (req as any).rp_users;
              const requesterName = reqTenant
                ? `${reqTenant.first_name} ${reqTenant.last_name}`
                : "Unknown";
              const urgencyStyle =
                URGENCY_STYLES[req.urgency] ?? URGENCY_STYLES.low;
              return (
                <div
                  key={req.id}
                  className="flex items-start gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {req.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          person
                        </span>
                        {requesterName}
                      </span>
                      {req.category && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">
                            category
                          </span>
                          {req.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgencyStyle}`}
                      >
                        {req.urgency}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant whitespace-nowrap pt-0.5">
                    <DateDisplay date={req.created_at} format="relative" />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            folder_open
          </span>
          <h2 className="font-headline font-bold text-lg">Documents</h2>
          {(documents ?? []).length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant text-xs font-bold ml-auto">
              {(documents ?? []).length}
            </span>
          )}
        </div>

        {(documents ?? []).length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              description
            </span>
            <p className="text-sm text-on-surface-variant">
              No documents uploaded
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {(documents ?? []).map((doc) => {
              const sizeKB = doc.file_size
                ? Math.round(doc.file_size / 1024)
                : null;
              return (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-primary-fixed-variant text-sm">
                      description
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate group-hover:underline">
                      {doc.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-0.5">
                      {doc.category && (
                        <span className="capitalize">{doc.category}</span>
                      )}
                      {sizeKB !== null && <span>{sizeKB} KB</span>}
                      {doc.visible_to_tenant && (
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">
                            visibility
                          </span>
                          Visible to tenant
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-on-surface-variant whitespace-nowrap">
                      <DateDisplay date={doc.created_at} format="short" />
                    </span>
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">
                      open_in_new
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section className="space-y-8">
      <Link
        href="/admin/properties"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Properties
      </Link>
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
          home_work
        </span>
        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          Property Not Found
        </h2>
        <p className="text-on-surface-variant">
          This property doesn&apos;t exist or doesn&apos;t belong to your
          account.
        </p>
      </div>
    </section>
  );
}
