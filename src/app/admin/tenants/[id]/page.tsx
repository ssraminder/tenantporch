import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { formatCurrency } from "@/lib/currency";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";
import { IdVerificationForm } from "@/components/forms/id-verification-form";

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

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tenantId } = await params;
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

  // Fetch the tenant user
  const { data: tenant } = await supabase
    .from("rp_users")
    .select(
      "id, first_name, last_name, email, phone, role, avatar_url, created_at, id_type, id_number, id_place_of_issue, id_expiry_date, id_name_on_document, id_document_url, id_document_status, id_uploaded_at, id_reviewed_at"
    )
    .eq("id", tenantId)
    .single();

  if (!tenant) return <NotFound />;

  // Get all landlord's properties
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id, address_line1, address_line2, city, province_state, postal_code, unit_description")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyMap = (properties ?? []).reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<
      string,
      {
        id: string;
        address_line1: string;
        address_line2: string | null;
        city: string;
        province_state: string;
        postal_code: string;
        unit_description: string | null;
      }
    >
  );

  if (propertyIds.length === 0) return <NotFound />;

  // Get all leases for those properties
  const { data: allLeases } = await supabase
    .from("rp_leases")
    .select(
      "id, property_id, lease_type, start_date, end_date, monthly_rent, currency_code, security_deposit, deposit_paid_date, utility_split_percent, internet_included, pad_enabled, pets_allowed, smoking_allowed, max_occupants, late_fee_type, late_fee_amount, status, created_at"
    )
    .in("property_id", propertyIds)
    .order("start_date", { ascending: false });

  const leaseIds = (allLeases ?? []).map((l) => l.id);

  if (leaseIds.length === 0) return <NotFound />;

  // Check if this tenant is on any of those leases
  const { data: leaseTenantLinks } = await supabase
    .from("rp_lease_tenants")
    .select("id, lease_id, role, is_primary_contact")
    .eq("user_id", tenantId)
    .in("lease_id", leaseIds);

  if (!leaseTenantLinks || leaseTenantLinks.length === 0) return <NotFound />;

  // Pick the current/most-recent lease (prefer active, then draft, then most recent)
  const tenantLeaseIds = leaseTenantLinks.map((lt) => lt.lease_id);
  const tenantLeases = (allLeases ?? []).filter((l) =>
    tenantLeaseIds.includes(l.id)
  );

  const sortedLeases = [...tenantLeases].sort((a, b) => {
    const priority: Record<string, number> = {
      active: 0,
      draft: 1,
      expired: 2,
      terminated: 3,
    };
    const aPri = priority[a.status] ?? 9;
    const bPri = priority[b.status] ?? 9;
    if (aPri !== bPri) return aPri - bPri;
    return b.start_date.localeCompare(a.start_date);
  });

  const currentLease = sortedLeases[0] ?? null;
  const currentLeaseTenantLink = currentLease
    ? leaseTenantLinks.find((lt) => lt.lease_id === currentLease.id)
    : null;
  const currentProperty = currentLease
    ? propertyMap[currentLease.property_id]
    : null;
  const leaseDisplayStatus = currentLease
    ? getLeaseDisplayStatus(currentLease)
    : null;

  // Fetch payments for this tenant across landlord's leases (last 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payments: any[] = [];
  {
    const { data: paymentData } = await supabase
      .from("rp_payments")
      .select(
        "id, amount, total_charged, status, payment_method, payment_for_month, created_at, currency_code"
      )
      .eq("tenant_id", tenantId)
      .in("lease_id", tenantLeaseIds)
      .order("created_at", { ascending: false })
      .limit(10);
    payments = paymentData ?? [];
  }

  // Fetch maintenance requests for this tenant across landlord's properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let maintenanceRequests: any[] = [];
  {
    const { data: maintData } = await supabase
      .from("rp_maintenance_requests")
      .select(
        "id, title, category, urgency, status, created_at, property_id, rp_properties(address_line1)"
      )
      .eq("tenant_id", tenantId)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });
    maintenanceRequests = maintData ?? [];
  }

  // Fetch documents associated with this tenant's leases
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let documents: any[] = [];
  {
    const { data: docData } = await supabase
      .from("rp_documents")
      .select(
        "id, title, category, file_url, file_size, visible_to_tenant, created_at"
      )
      .in("lease_id", tenantLeaseIds)
      .order("created_at", { ascending: false });
    documents = docData ?? [];
  }

  // Compute active addendum rent for current lease
  let activeAddendumRent = 0;
  if (currentLease) {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: addendumData } = await supabase
      .from("rp_addendums")
      .select("additional_rent_amount, effective_from, effective_to")
      .eq("lease_id", currentLease.id)
      .eq("status", "signed")
      .lte("effective_from", todayStr);

    activeAddendumRent = (addendumData ?? [])
      .filter((a) => !a.effective_to || a.effective_to >= todayStr)
      .reduce((sum, a) => sum + Number(a.additional_rent_amount ?? 0), 0);
  }

  const effectiveRent = currentLease
    ? Number(currentLease.monthly_rent) + activeAddendumRent
    : 0;

  const initials = `${tenant.first_name?.[0]?.toUpperCase() ?? ""}${tenant.last_name?.[0]?.toUpperCase() ?? ""}`;
  const currency = currentLease?.currency_code ?? "CAD";

  return (
    <section className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Tenants", href: "/admin/tenants", icon: "group" },
          { label: `${tenant.first_name} ${tenant.last_name}` },
        ]}
      />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Link
          href={`/admin/messages/new?tenant=${tenantId}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-lg">chat</span>
          Send Message
        </Link>
        {currentLease && (
          <Link
            href={`/admin/payments/new?tenant=${tenantId}&lease=${currentLease.id}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            Record Payment
          </Link>
        )}
        {currentProperty && (
          <Link
            href={`/admin/properties/${currentProperty.id}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-lg">apartment</span>
            View Property
          </Link>
        )}
      </div>

      {/* Profile Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-on-primary-fixed-variant">
              {initials}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
                {tenant.first_name} {tenant.last_name}
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-fixed/30 text-on-primary-fixed-variant">
                {tenant.role}
              </span>
              {currentLeaseTenantLink?.is_primary_contact && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed/30 text-on-tertiary-fixed-variant">
                  Primary Contact
                </span>
              )}
              {currentLeaseTenantLink?.role === "permitted_occupant" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant">
                  Occupant
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">mail</span>
                {tenant.email}
              </span>
              {tenant.phone && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    phone
                  </span>
                  {tenant.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  calendar_month
                </span>
                Member since{" "}
                <DateDisplay date={tenant.created_at} format="medium" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ID Verification */}
      <IdVerificationForm
        tenantId={tenantId}
        mode="admin"
        currentData={{
          id_type: tenant.id_type,
          id_number: tenant.id_number,
          id_place_of_issue: tenant.id_place_of_issue,
          id_expiry_date: tenant.id_expiry_date,
          id_name_on_document: tenant.id_name_on_document,
          id_document_url: tenant.id_document_url,
          id_document_status: tenant.id_document_status,
          id_uploaded_at: tenant.id_uploaded_at,
          id_reviewed_at: tenant.id_reviewed_at,
        }}
      />

      {/* Lease Info Card */}
      {currentLease && currentProperty && leaseDisplayStatus && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                gavel
              </span>
              <h2 className="font-headline font-bold text-xl">Lease Details</h2>
            </div>
            <StatusBadge status={leaseDisplayStatus.key} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {/* Property */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Property
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {currentProperty.address_line1}
                {currentProperty.address_line2
                  ? `, ${currentProperty.address_line2}`
                  : ""}
              </p>
              <p className="text-xs text-on-surface-variant">
                {currentProperty.city}, {currentProperty.province_state}{" "}
                {currentProperty.postal_code}
              </p>
              {currentProperty.unit_description && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {currentProperty.unit_description}
                </p>
              )}
            </div>

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
                    <DateDisplay date={currentLease.end_date} format="medium" />
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
                {formatCurrency(effectiveRent, currency)}
              </p>
              {activeAddendumRent > 0 && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Base {formatCurrency(currentLease.monthly_rent, currency)} + {formatCurrency(activeAddendumRent, currency)} addendum
                </p>
              )}
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

            {/* Pets Allowed */}
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

            {/* Smoking Allowed */}
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

            {/* PAD Enabled */}
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
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            receipt_long
          </span>
          <h2 className="font-headline font-bold text-lg">Payment History</h2>
          <span className="text-xs text-on-surface-variant ml-auto">
            Last 10
          </span>
        </div>

        {payments.length === 0 ? (
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
                    <th className="px-4 py-3">For Month</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 pr-6 md:pr-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {payments.map((payment) => {
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
                        <td className="px-4 py-4 text-sm text-on-surface-variant">
                          {payment.payment_for_month ?? "\u2014"}
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
              {payments.map((payment) => {
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
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          event
                        </span>
                        <DateDisplay
                          date={payment.created_at}
                          format="short"
                        />
                      </span>
                      {payment.payment_for_month && (
                        <span>For: {payment.payment_for_month}</span>
                      )}
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

      {/* Maintenance Requests */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            handyman
          </span>
          <h2 className="font-headline font-bold text-lg">
            Maintenance Requests
          </h2>
          {maintenanceRequests.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant text-xs font-bold ml-auto">
              {maintenanceRequests.length}
            </span>
          )}
        </div>

        {maintenanceRequests.length === 0 ? (
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
            {maintenanceRequests.map((req) => {
              const propAddress =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (req.rp_properties as any)?.address_line1 ?? "Unknown";
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
                          location_on
                        </span>
                        {propAddress}
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
          {documents.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant text-xs font-bold ml-auto">
              {documents.length}
            </span>
          )}
        </div>

        {documents.length === 0 ? (
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
            {documents.map((doc) => {
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
        href="/admin/tenants"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Tenants
      </Link>
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
          person_off
        </span>
        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          Tenant Not Found
        </h2>
        <p className="text-on-surface-variant">
          This tenant doesn&apos;t exist or doesn&apos;t belong to your
          properties.
        </p>
      </div>
    </section>
  );
}
