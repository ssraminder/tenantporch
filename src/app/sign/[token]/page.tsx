import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { formatCurrency } from "@/lib/currency";

export const metadata = {
  title: "Sign Lease — TenantPorch",
  description: "Review and sign your lease agreement electronically.",
};

export default async function LeaseSigningPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // For initial build, treat the token as the lease ID
  const { data: lease, error: leaseError } = await supabase
    .from("rp_leases")
    .select(
      `
      id,
      property_id,
      lease_type,
      start_date,
      end_date,
      monthly_rent,
      currency_code,
      security_deposit,
      utility_split_percent,
      internet_included,
      pets_allowed,
      smoking_allowed,
      max_occupants,
      guest_max_consecutive_nights,
      guest_max_monthly_nights,
      lease_document_url,
      province_template,
      status
    `
    )
    .eq("id", token)
    .single();

  // Invalid or expired link
  if (leaseError || !lease) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-on-error-container">
                link_off
              </span>
            </div>
            <h1 className="font-headline text-xl font-bold text-on-surface mb-2">
              Invalid Signing Link
            </h1>
            <p className="text-sm text-on-surface-variant">
              This signing link is invalid or has expired. Please contact your
              landlord for a new link.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Already signed
  if (lease.status !== "draft") {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-on-tertiary-fixed-variant">
                task_alt
              </span>
            </div>
            <h1 className="font-headline text-xl font-bold text-on-surface mb-2">
              Lease Already Signed
            </h1>
            <p className="text-sm text-on-surface-variant">
              This lease has already been signed. No further action is required.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Fetch property details
  const { data: property } = await supabase
    .from("rp_properties")
    .select(
      `
      id,
      address_line1,
      address_line2,
      city,
      province_state,
      postal_code,
      has_separate_entrance,
      has_separate_mailbox,
      parking_spots,
      is_furnished,
      landlord_id
    `
    )
    .eq("id", lease.property_id)
    .single();

  // Fetch landlord info
  let landlord: { first_name: string; last_name: string; email: string } | null =
    null;
  if (property?.landlord_id) {
    const { data: ll } = await supabase
      .from("rp_users")
      .select("first_name, last_name, email")
      .eq("id", property.landlord_id)
      .single();
    landlord = ll;
  }

  // Fetch tenants on this lease
  const { data: leaseTenants } = await supabase
    .from("rp_lease_tenants")
    .select("id, user_id, role, is_primary_contact")
    .eq("lease_id", lease.id);

  const tenantUserIds = (leaseTenants ?? []).map((lt) => lt.user_id);
  let tenantUsers: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }[] = [];

  if (tenantUserIds.length > 0) {
    const { data: users } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name, email")
      .in("id", tenantUserIds);
    tenantUsers = users ?? [];
  }

  // Build tenant list with roles
  const tenants = (leaseTenants ?? []).map((lt) => {
    const user = tenantUsers.find((u) => u.id === lt.user_id);
    return {
      name: user ? `${user.first_name} ${user.last_name}` : "Unknown",
      email: user?.email ?? "",
      role: lt.role,
      isPrimary: lt.is_primary_contact,
    };
  });

  const fullAddress = [
    property?.address_line1,
    property?.address_line2,
    property?.city,
    property?.province_state,
    property?.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const leaseTypeLabel =
    lease.lease_type === "fixed" ? "Fixed Term" : "Month-to-Month";

  const provinceTemplateLabel = lease.province_template
    ? `${lease.province_template.charAt(0).toUpperCase()}${lease.province_template.slice(1)} Standard`
    : "Standard";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page Title */}
        <div className="text-center space-y-2">
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Residential Lease Agreement
          </h1>
          <p className="text-sm text-on-surface-variant">
            Please review all terms below before signing
          </p>
        </div>

        {/* Lease Summary Card */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Lease Summary
            </h2>
            <StatusBadge status="draft" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow icon="location_on" label="Property" value={fullAddress} />
            <DetailRow
              icon="description"
              label="Lease Type"
              value={leaseTypeLabel}
            />
            <DetailRow
              icon="calendar_month"
              label="Start Date"
              value={<DateDisplay date={lease.start_date} format="long" />}
            />
            <DetailRow
              icon="event"
              label="End Date"
              value={
                lease.end_date ? (
                  <DateDisplay date={lease.end_date} format="long" />
                ) : (
                  "Ongoing"
                )
              }
            />
            <DetailRow
              icon="payments"
              label="Monthly Rent"
              value={formatCurrency(lease.monthly_rent, lease.currency_code)}
            />
            <DetailRow
              icon="savings"
              label="Security Deposit"
              value={
                lease.security_deposit
                  ? formatCurrency(lease.security_deposit, lease.currency_code)
                  : "None"
              }
            />
            <DetailRow
              icon="gavel"
              label="Province Template"
              value={provinceTemplateLabel}
              className="sm:col-span-2"
            />
          </div>
        </section>

        {/* Property Details */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8 space-y-5">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Property Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BooleanRow
              icon="door_front"
              label="Separate Entrance"
              value={property?.has_separate_entrance ?? false}
            />
            <BooleanRow
              icon="mail"
              label="Separate Mailbox"
              value={property?.has_separate_mailbox ?? false}
            />
            <DetailRow
              icon="local_parking"
              label="Parking Spots"
              value={
                property?.parking_spots != null
                  ? String(property.parking_spots)
                  : "None"
              }
            />
            <BooleanRow
              icon="chair"
              label="Furnished"
              value={property?.is_furnished ?? false}
            />
            <DetailRow
              icon="group"
              label="Max Occupants"
              value={
                lease.max_occupants != null
                  ? String(lease.max_occupants)
                  : "Not specified"
              }
            />
            <DetailRow
              icon="hotel"
              label="Guest Policy"
              value={formatGuestPolicy(
                lease.guest_max_consecutive_nights,
                lease.guest_max_monthly_nights
              )}
            />
          </div>
        </section>

        {/* Lease Terms */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8 space-y-5">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Lease Terms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow
              icon="electric_bolt"
              label="Utility Split"
              value={
                lease.utility_split_percent != null
                  ? `${lease.utility_split_percent}% tenant responsibility`
                  : "Not specified"
              }
            />
            <BooleanRow
              icon="wifi"
              label="Internet Included"
              value={lease.internet_included ?? false}
            />
            <BooleanRow
              icon="pets"
              label="Pets Allowed"
              value={lease.pets_allowed ?? false}
            />
            <BooleanRow
              icon="smoking_rooms"
              label="Smoking Allowed"
              value={lease.smoking_allowed ?? false}
            />
            <DetailRow
              icon="schedule"
              label="Late Payment Fee"
              value="As per provincial regulations"
              className="sm:col-span-2"
            />
          </div>
        </section>

        {/* Parties */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8 space-y-5">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Parties to This Lease
          </h2>

          {/* Landlord */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              Landlord
            </h3>
            <div className="bg-surface-container-low rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-fixed/30 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary-fixed-variant">
                  person
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {landlord
                    ? `${landlord.first_name} ${landlord.last_name}`
                    : "Not available"}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  {landlord?.email ?? ""}
                </p>
              </div>
            </div>
          </div>

          {/* Tenants */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              {tenants.length === 1 ? "Tenant" : "Tenants"}
            </h3>
            {tenants.length > 0 ? (
              <div className="space-y-2">
                {tenants.map((tenant, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container-low rounded-xl px-5 py-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed/30 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-secondary-fixed-variant">
                        person
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {tenant.name}
                        </p>
                        {tenant.isPrimary && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-primary-fixed-variant bg-primary-fixed/30 px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">
                        {tenant.email}
                        {tenant.role ? ` \u00b7 ${tenant.role}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                No tenants assigned yet.
              </p>
            )}
          </div>
        </section>

        {/* Lease Document Link */}
        {lease.lease_document_url && (
          <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">
                picture_as_pdf
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">
                  Full Lease Document
                </p>
                <p className="text-xs text-on-surface-variant">
                  Review the complete lease agreement before signing
                </p>
              </div>
              <a
                href={lease.lease_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-fixed/20 text-on-primary-fixed-variant text-sm font-semibold hover:bg-primary-fixed/30 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  open_in_new
                </span>
                View PDF
              </a>
            </div>
          </section>
        )}

        {/* Signature Area */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-6 sm:p-8 space-y-6">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Electronic Signature
          </h2>

          {/* Signature Canvas Placeholder */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface-variant">
              Sign Here
            </label>
            <div className="w-full h-40 rounded-xl bg-surface-container-low flex items-center justify-center"
              style={{ border: "2px dashed var(--outline-variant, #c5c6cf)" }}
            >
              <div className="text-center">
                <span className="material-symbols-outlined text-3xl text-outline">
                  draw
                </span>
                <p className="text-sm text-on-surface-variant mt-1">
                  Draw your signature here
                </p>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>
              Signing timestamp will be recorded upon submission
            </span>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 bg-surface-container-low rounded-xl px-5 py-4">
            <input
              type="checkbox"
              id="agree-terms"
              disabled
              className="mt-0.5 h-5 w-5 rounded accent-primary flex-shrink-0"
            />
            <label
              htmlFor="agree-terms"
              className="text-sm text-on-surface leading-relaxed"
            >
              I have read and agree to all terms of this lease agreement. I
              understand that this electronic signature is legally binding and
              constitutes my acceptance of the lease terms as presented above.
            </label>
          </div>

          {/* Sign Button */}
          <button
            disabled
            className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline font-bold text-base shadow-ambient-sm opacity-50 cursor-not-allowed transition-colors"
          >
            Sign &amp; Submit
          </button>

          {/* Legal Disclaimer */}
          <p className="text-xs text-on-surface-variant leading-relaxed text-center">
            By clicking &quot;Sign &amp; Submit,&quot; you consent to use an
            electronic signature in accordance with the{" "}
            <span className="font-semibold">
              Personal Information Protection and Electronic Documents Act
              (PIPEDA)
            </span>{" "}
            and applicable provincial electronic commerce legislation. This
            electronic signature carries the same legal weight as a handwritten
            signature. A copy of the signed lease will be emailed to all parties.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Reusable sub-components ────────────────────────────────────────────── */

function Header() {
  return (
    <header className="w-full bg-surface-container-lowest shadow-ambient-sm">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-lg">
              home_work
            </span>
          </div>
          <span className="font-headline font-extrabold text-primary text-lg tracking-tight">
            TenantPorch
          </span>
        </div>
        <span className="text-sm font-semibold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
          Lease Signing
        </span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-surface-container-low">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center space-y-2">
        <p className="text-xs text-on-surface-variant font-semibold">
          Powered by TenantPorch
        </p>
        <p className="text-xs text-on-surface-variant leading-relaxed max-w-lg mx-auto">
          This lease is prepared in accordance with the Alberta Residential
          Tenancies Act (RTA). Both landlord and tenant rights and obligations
          are governed by provincial legislation. For more information, visit the{" "}
          <a
            href="https://www.alberta.ca/residential-tenancies-act"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary transition-colors"
          >
            Alberta RTA
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

function DetailRow({
  icon,
  label,
  value,
  className,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <span className="material-symbols-outlined text-on-surface-variant text-lg mt-0.5 flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant font-medium">{label}</p>
        <p className="text-sm font-semibold text-on-surface mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function BooleanRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-on-surface-variant text-lg flex-shrink-0">
        {icon}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-xs text-on-surface-variant font-medium">{label}</p>
        <span
          className={`material-symbols-outlined text-base ${
            value ? "text-on-tertiary-container" : "text-outline"
          }`}
        >
          {value ? "check_circle" : "cancel"}
        </span>
        <span className="text-sm font-semibold text-on-surface">
          {value ? "Yes" : "No"}
        </span>
      </div>
    </div>
  );
}

function formatGuestPolicy(
  maxConsecutive: number | null,
  maxMonthly: number | null
): string {
  const parts: string[] = [];

  if (maxConsecutive != null) {
    parts.push(
      `${maxConsecutive} consecutive night${maxConsecutive === 1 ? "" : "s"} max`
    );
  }
  if (maxMonthly != null) {
    parts.push(
      `${maxMonthly} night${maxMonthly === 1 ? "" : "s"}/month max`
    );
  }

  return parts.length > 0 ? parts.join(", ") : "No restrictions";
}
