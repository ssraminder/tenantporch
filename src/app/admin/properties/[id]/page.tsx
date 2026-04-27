import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { DeletePropertyButton } from "@/components/shared/delete-property-button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { formatCurrency } from "@/lib/currency";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";
import { ApplicationLinkCard } from "./application-link-card";
import { PropertyOwnersSection } from "@/components/forms/property-owners-section";

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

const PARKING_LABELS: Record<string, string> = {
  none: "None",
  driveway: "Driveway",
  garage: "Garage",
  carport: "Carport",
  street: "Street",
  underground: "Underground",
  assigned: "Assigned Spot",
};

const LAUNDRY_LABELS: Record<string, string> = {
  none: "None",
  in_unit: "In-Unit",
  shared: "Shared",
  coin_op: "Coin-Op",
};

const HEATING_LABELS: Record<string, string> = {
  forced_air: "Forced Air",
  baseboard: "Baseboard",
  radiant: "Radiant Floor",
  boiler: "Boiler",
  heat_pump: "Heat Pump",
  other: "Other",
};

const COOLING_LABELS: Record<string, string> = {
  none: "None",
  central_ac: "Central AC",
  window_unit: "Window Unit",
  mini_split: "Mini Split",
  evaporative: "Evaporative",
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
      "id, landlord_id, address_line1, address_line2, city, province_state, postal_code, country_code, unit_description, sticker_number, has_separate_entrance, has_separate_mailbox, parking_spots, is_furnished, status, monthly_rent, created_at, parking_type, laundry_type, wifi_ssid, wifi_password, heating_type, cooling_type, pet_deposit, storage_included, yard_access"
    )
    .eq("id", propertyId)
    .single();

  if (!property || property.landlord_id !== rpUser.id) return <NotFound />;

  // Fetch property owners
  const { data: ownerData } = await supabase
    .from("rp_property_owners")
    .select(
      "id, user_id, designation, is_primary, rp_users!inner(first_name, last_name, email)"
    )
    .eq("property_id", propertyId)
    .order("is_primary", { ascending: false });

  const propertyOwners = (ownerData ?? []).map((o) => ({
    id: o.id,
    user_id: o.user_id,
    designation: o.designation,
    is_primary: o.is_primary,
    first_name: (o.rp_users as any).first_name,
    last_name: (o.rp_users as any).last_name,
    email: (o.rp_users as any).email,
  }));

  // Fetch current lease (active or draft, prefer active)
  const { data: leases } = await supabase
    .from("rp_leases")
    .select(
      "id, lease_type, start_date, end_date, monthly_rent, currency_code, security_deposit, deposit_paid_date, utility_split_percent, internet_included, pad_enabled, pets_allowed, smoking_allowed, max_occupants, late_fee_type, late_fee_amount, status, signing_status, created_at"
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
          "id, amount, status, payment_method, payment_for_month, created_at, currency_code"
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

  // Fetch addendums for this property
  const { data: addendums } = await supabase
    .from("rp_addendums")
    .select(
      "id, lease_id, addendum_type, title, additional_rent_amount, currency_code, effective_from, effective_to, status, created_at"
    )
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  // Compute active addendum rent for the current lease
  const today = new Date().toISOString().split("T")[0];
  const activeAddendumRent = (addendums ?? [])
    .filter(
      (a) =>
        a.status === "signed" &&
        a.effective_from <= today &&
        (!a.effective_to || a.effective_to >= today)
    )
    .reduce((sum, a) => sum + Number(a.additional_rent_amount ?? 0), 0);

  const effectiveRent = currentLease
    ? Number(currentLease.monthly_rent) + activeAddendumRent
    : Number(property.monthly_rent) + activeAddendumRent;

  // Fetch existing application link token (public placeholder)
  const { data: existingAppLink } = await supabase
    .from("rp_tenant_applications")
    .select("application_url_token")
    .eq("property_id", propertyId)
    .eq("landlord_id", rpUser.id)
    .eq("is_public_link", true)
    .is("first_name", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingToken = existingAppLink?.application_url_token ?? null;

  const fullAddress = `${property.address_line1}${property.address_line2 ? `, ${property.address_line2}` : ""}, ${property.city}, ${property.province_state} ${property.postal_code}`;

  return (
    <section className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Properties", href: "/admin/properties", icon: "apartment" },
          { label: property.address_line1 },
        ]}
      />

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

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <Link
              href={`/admin/properties/${propertyId}/inventory`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chair</span>
              Furnished Inventory
            </Link>
            <Link
              href={`/admin/properties/${propertyId}/edit`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Property
            </Link>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">info</span>
          <h2 className="font-headline font-bold text-xl">Property Details</h2>
        </div>

        <div className="space-y-8">
          {/* Unit Features */}
          <div>
            <h3 className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                apartment
              </span>
              Unit Features
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
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
                  Storage Included
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    {property.storage_included ? "check_circle" : "cancel"}
                  </span>
                  {property.storage_included ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Yard Access
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    {property.yard_access ? "check_circle" : "cancel"}
                  </span>
                  {property.yard_access ? "Yes" : "No"}
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
            </div>
          </div>

          {/* Parking & Laundry */}
          <div>
            <h3 className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                local_parking
              </span>
              Parking &amp; Laundry
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Parking Type
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    local_parking
                  </span>
                  {PARKING_LABELS[property.parking_type ?? ""] ?? "Not set"}
                </p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Parking Spots
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {property.parking_spots ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Laundry Type
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    local_laundry_service
                  </span>
                  {LAUNDRY_LABELS[property.laundry_type ?? ""] ?? "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Climate Control */}
          <div>
            <h3 className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                thermostat
              </span>
              Climate Control
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Heating Type
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    thermostat
                  </span>
                  {HEATING_LABELS[property.heating_type ?? ""] ?? "Not set"}
                </p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Cooling Type
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    ac_unit
                  </span>
                  {COOLING_LABELS[property.cooling_type ?? ""] ?? "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Internet / WiFi */}
          <div>
            <h3 className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                wifi
              </span>
              Internet / WiFi
            </h3>
            {property.wifi_ssid ? (
              <div className="bg-surface-container-low rounded-2xl p-5 max-w-sm">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-3">
                  WiFi Network
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm text-primary">
                      wifi
                    </span>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                        SSID
                      </p>
                      <p className="text-sm font-bold text-on-surface font-mono">
                        {property.wifi_ssid}
                      </p>
                    </div>
                  </div>
                  {property.wifi_password && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm text-primary">
                        key
                      </span>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                          Password
                        </p>
                        <p className="text-sm font-bold text-on-surface font-mono select-all">
                          {property.wifi_password}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Not configured</p>
            )}
          </div>

          {/* Financials */}
          <div>
            <h3 className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                payments
              </span>
              Financials
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Monthly Rent
                </p>
                <p className="text-sm font-bold text-primary">
                  {formatCurrency(effectiveRent)}
                </p>
                {activeAddendumRent > 0 && (
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Base {formatCurrency(property.monthly_rent)} + {formatCurrency(activeAddendumRent)} addendum
                  </p>
                )}
              </div>

              {property.pet_deposit != null && Number(property.pet_deposit) > 0 && (
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                    Pet Deposit
                  </p>
                  <p className="text-sm font-bold text-on-surface">
                    {formatCurrency(Number(property.pet_deposit))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Owners */}
      <PropertyOwnersSection propertyId={propertyId} owners={propertyOwners} />

      {/* Current Lease Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              gavel
            </span>
            <h2 className="font-headline font-bold text-xl">Current Lease</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {leaseDisplayStatus && (
              <StatusBadge status={leaseDisplayStatus.key} />
            )}
            {currentLease?.signing_status === "completed" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed/30 text-on-tertiary-fixed-variant">
                <span className="material-symbols-outlined text-xs">verified</span>
                Signed
              </span>
            )}
            {currentLease?.signing_status === "sent" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-fixed/30 text-on-secondary-fixed-variant">
                Sent for Signing
              </span>
            )}
            {currentLease?.signing_status === "partially_signed" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-fixed/30 text-on-secondary-fixed-variant">
                Partially Signed
              </span>
            )}
            {currentLease && (
              <>
                {currentLease.status === "active" && (
                  <Link
                    href={`/admin/payments/new?lease=${currentLease.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tertiary text-on-tertiary text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Record Payment
                  </Link>
                )}
                {(currentLease.status === "active" || currentLease.status === "expired") && (
                  <Link
                    href={`/admin/leases/${currentLease.id}/renew`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">autorenew</span>
                    Renew Lease
                  </Link>
                )}
                {currentLease.security_deposit != null && Number(currentLease.security_deposit) > 0 && (
                  <Link
                    href={`/admin/leases/${currentLease.id}/deposit-refund`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                    Refund Deposit
                  </Link>
                )}
                <Link
                  href={`/admin/leases/${currentLease.id}/document`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">description</span>
                  Document
                </Link>
                {currentLease.signing_status !== "completed" && (
                  <Link
                    href={`/admin/leases/${currentLease.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit Lease
                  </Link>
                )}
              </>
            )}
          </div>
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

      {/* Application Link */}
      <ApplicationLinkCard
        propertyId={propertyId}
        landlordId={rpUser.id}
        propertyAddress={property.address_line1}
        existingToken={existingToken}
      />

      {/* Tenants Section */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">group</span>
          <h2 className="font-headline font-bold text-lg">Tenants</h2>
          {leaseTenants.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant text-xs font-bold">
              {leaseTenants.length}
            </span>
          )}
          {currentLease && (
            <Link
              href={`/admin/tenants/invite?propertyId=${propertyId}&leaseId=${currentLease.id}`}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Add Tenant
            </Link>
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
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 pr-6 md:pr-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentPayments.map((payment) => {
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
                          {property.address_line1}
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
                        {property.address_line1}
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

      {/* Addendums */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            post_add
          </span>
          <h2 className="font-headline font-bold text-lg">Addendums</h2>
          <span className="text-xs text-on-surface-variant ml-auto">
            {(addendums ?? []).length}
          </span>
          {currentLease && (
            <Link
              href={`/admin/addendums/new?propertyId=${propertyId}&leaseId=${currentLease.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Addendum
            </Link>
          )}
        </div>

        {(addendums ?? []).length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              post_add
            </span>
            <p className="text-sm text-on-surface-variant">
              No addendums for this property
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {(addendums ?? []).map((addendum) => {
              const hasRent = Number(addendum.additional_rent_amount ?? 0) > 0;
              return (
                <div
                  key={addendum.id}
                  className="px-6 md:px-8 py-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-primary-fixed-variant text-lg">
                      description
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {addendum.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span className="text-xs text-on-surface-variant">
                        <DateDisplay date={addendum.effective_from} format="short" />
                        {addendum.effective_to && (
                          <>
                            {" "}— <DateDisplay date={addendum.effective_to} format="short" />
                          </>
                        )}
                      </span>
                      {hasRent && (
                        <span className="text-xs font-semibold text-tertiary">
                          +{formatCurrency(
                            Number(addendum.additional_rent_amount),
                            addendum.currency_code ?? "CAD"
                          )}
                          /mo
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={addendum.status} />
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

      {/* Danger Zone: Delete Property */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden border border-error/20">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-error">
              warning
            </span>
            <h2 className="text-lg font-headline font-bold text-error">
              Danger Zone
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant mb-6">
            Permanently delete this property and all associated data. Properties
            with active leases cannot be deleted.
          </p>
          <DeletePropertyButton propertyId={propertyId} />
        </div>
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
