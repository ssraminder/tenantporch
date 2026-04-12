"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Property = {
  id: string;
  address_line1: string;
  city: string;
};

type Lease = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  monthly_rent: number;
};

export default function InviteTenantPage() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const prefillPropertyId = searchParams.get("propertyId") ?? "";
  const prefillLeaseId = searchParams.get("leaseId") ?? "";

  // Mode: "create" = direct account creation, "invite" = send invite link
  const [mode, setMode] = useState<"create" | "invite">("create");

  // Form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(prefillPropertyId);
  const [selectedLeaseId, setSelectedLeaseId] = useState(prefillLeaseId);
  const [role, setRole] = useState<"tenant" | "permitted_occupant">("tenant");
  const [wantsAdditionalRent, setWantsAdditionalRent] = useState(false);
  const [additionalRentAmount, setAdditionalRentAmount] = useState("");

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filteredLeases, setFilteredLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load landlord's properties on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: rpUser } = await supabase
          .from("rp_users")
          .select("id")
          .eq("auth_id", user.id)
          .single();
        if (!rpUser) return;

        const { data: propData } = await supabase
          .from("rp_properties")
          .select("id, address_line1, city")
          .eq("landlord_id", rpUser.id)
          .order("address_line1");
        setProperties(propData ?? []);

        const propertyIds = (propData ?? []).map((p) => p.id);
        if (propertyIds.length > 0) {
          const { data: leaseData } = await supabase
            .from("rp_leases")
            .select("id, property_id, start_date, end_date, status, monthly_rent")
            .in("property_id", propertyIds)
            .order("start_date", { ascending: false });
          setLeases(leaseData ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter leases when property selection changes
  const userChangedProperty = useRef(false);
  useEffect(() => {
    if (selectedPropertyId) {
      const filtered = leases.filter((l) => l.property_id === selectedPropertyId);
      setFilteredLeases(filtered);

      if (userChangedProperty.current) {
        setSelectedLeaseId("");
      }
    } else {
      setFilteredLeases([]);
      setSelectedLeaseId("");
    }
  }, [selectedPropertyId, leases]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!selectedPropertyId) {
      setError("Please select a property.");
      return;
    }
    if (!selectedLeaseId) {
      setError("Please select a lease.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "create") {
        const { inviteTenant } = await import("@/app/admin/actions/invite-actions");
        const result = await inviteTenant({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          propertyId: selectedPropertyId,
          leaseId: selectedLeaseId,
          role,
        });

        if (result.success) {
          if (
            role === "permitted_occupant" &&
            wantsAdditionalRent &&
            additionalRentAmount &&
            parseFloat(additionalRentAmount) > 0
          ) {
            const occupant = `${firstName.trim()} ${lastName.trim()}`.trim();
            const params = new URLSearchParams({
              propertyId: selectedPropertyId,
              leaseId: selectedLeaseId,
              type: "occupant",
              occupantName: occupant || email.trim(),
            });
            router.push(`/admin/addendums/new?${params.toString()}`);
            return;
          }
          setSuccess(true);
        } else {
          setError(result.error ?? "Failed to create account.");
        }
      } else {
        const { sendTenantInvite } = await import("@/app/admin/actions/invite-actions");
        const result = await sendTenantInvite({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          propertyId: selectedPropertyId,
          leaseId: selectedLeaseId,
          role,
        });

        if (result.success) {
          setSuccess(true);
        } else {
          setError(result.error ?? "Failed to send invitation.");
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setSelectedPropertyId("");
    setSelectedLeaseId("");
    setRole("tenant");
    setMode("create");
    setSuccess(false);
    setError(null);
  }

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tenants"
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              arrow_back
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Add Tenant
          </h1>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient-sm flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin block mb-3">
              progress_activity
            </span>
            <p className="text-sm text-on-surface-variant">Loading properties...</p>
          </div>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tenants"
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              arrow_back
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Add Tenant
          </h1>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed/30 flex items-center justify-center mx-auto mb-6">
            <span
              className="material-symbols-outlined text-3xl text-on-tertiary-fixed-variant"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">
            {mode === "create" ? "Tenant Account Created" : "Invitation Sent"}
          </h2>
          <p className="text-on-surface-variant mb-2">
            {mode === "create"
              ? <>Login credentials have been emailed to <strong>{email}</strong>.</>
              : <>An invite link has been sent to <strong>{email}</strong>.</>}
          </p>
          <p className="text-xs text-on-surface-variant mb-8">
            {mode === "create"
              ? "The tenant must change their password on first login."
              : "The tenant will create their own password when they accept the invitation."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Add Another Tenant
            </button>
            <Link
              href="/admin/tenants"
              className="bg-surface-container-low text-on-surface px-6 py-3 rounded-xl font-bold hover:bg-surface-container-high transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Tenants
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/tenants"
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Add Tenant
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Create an account or send an invite link
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm p-1 flex gap-1">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            mode === "create"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Create Account
        </button>
        <button
          type="button"
          onClick={() => setMode("invite")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            mode === "invite"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-sm">send</span>
          Send Invite Link
        </button>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-3 bg-surface-container-low rounded-xl px-5 py-4">
        <span className="material-symbols-outlined text-on-surface-variant text-lg mt-0.5">
          info
        </span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {mode === "create"
            ? "Creates the tenant account immediately. A temporary password will be emailed and the tenant must change it on first login."
            : "Sends an invite email with a link. The tenant will set their own password when they accept the invitation."}
        </p>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden"
      >
        <div className="p-6 md:p-8 space-y-6">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-3 bg-error-container rounded-xl p-4">
              <span className="material-symbols-outlined text-on-error-container">
                error
              </span>
              <p className="text-sm font-medium text-on-error-container">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-bold text-primary mb-2"
            >
              Email Address <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                mail
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenant@example.com"
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-bold text-primary mb-2"
              >
                First Name <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  person
                </span>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-bold text-primary mb-2"
              >
                Last Name <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  person
                </span>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-bold text-primary mb-2"
            >
              Phone Number <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                phone
              </span>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(403) 555-0123"
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Property select */}
          <div>
            <label
              htmlFor="property"
              className="block text-sm font-bold text-primary mb-2"
            >
              Property <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                apartment
              </span>
              <select
                id="property"
                value={selectedPropertyId}
                onChange={(e) => { userChangedProperty.current = true; setSelectedPropertyId(e.target.value); }}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
              >
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address_line1}, {p.city}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                expand_more
              </span>
            </div>
            {properties.length === 0 && (
              <p className="text-xs text-on-surface-variant mt-2">
                No properties found.{" "}
                <Link href="/admin/properties" className="text-primary font-bold hover:underline">
                  Add a property
                </Link>{" "}
                first.
              </p>
            )}
          </div>

          {/* Lease select */}
          <div>
            <label
              htmlFor="lease"
              className="block text-sm font-bold text-primary mb-2"
            >
              Lease <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                gavel
              </span>
              <select
                id="lease"
                value={selectedLeaseId}
                onChange={(e) => setSelectedLeaseId(e.target.value)}
                disabled={!selectedPropertyId}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedPropertyId
                    ? filteredLeases.length === 0
                      ? "No leases for this property"
                      : "Select a lease"
                    : "Select a property first"}
                </option>
                {filteredLeases.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.start_date}
                    {l.end_date ? ` to ${l.end_date}` : " (ongoing)"} &mdash;{" "}
                    {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Role selection */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">
              Role <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                htmlFor="role-tenant"
                className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  role === "tenant"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  id="role-tenant"
                  type="radio"
                  name="role"
                  value="tenant"
                  checked={role === "tenant"}
                  onChange={() => setRole("tenant")}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    role === "tenant"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {role === "tenant" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">Tenant</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Full tenant with lease obligations and portal access
                  </p>
                </div>
              </label>

              <label
                htmlFor="role-occupant"
                className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  role === "permitted_occupant"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  id="role-occupant"
                  type="radio"
                  name="role"
                  value="permitted_occupant"
                  checked={role === "permitted_occupant"}
                  onChange={() => setRole("permitted_occupant")}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    role === "permitted_occupant"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {role === "permitted_occupant" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">
                    Permitted Occupant
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Lives in the unit but not a lease signatory
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Rent for Permitted Occupant */}
          {role === "permitted_occupant" && (
            <>
              <div className="h-px bg-outline-variant/15" />

              <div>
                <div className="flex items-start gap-3 bg-surface-container-low rounded-xl px-5 py-4 mb-4">
                  <input
                    type="checkbox"
                    id="additional-rent"
                    checked={wantsAdditionalRent}
                    onChange={(e) => setWantsAdditionalRent(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded accent-primary flex-shrink-0"
                  />
                  <label htmlFor="additional-rent" className="cursor-pointer">
                    <p className="text-sm font-bold text-primary">
                      Charge additional rent for this occupant?
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      A rent addendum will be created and sent for signatures. The additional charge applies during the addendum period.
                    </p>
                  </label>
                </div>

                {wantsAdditionalRent && (
                  <div className="ml-8">
                    <label className="block text-sm font-bold text-primary mb-2">
                      Additional Monthly Rent
                    </label>
                    <div className="relative max-w-xs">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                        attach_money
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={additionalRentAmount}
                        onChange={(e) => setAdditionalRentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2">
                      After sending the invitation, you&apos;ll be taken to create a rent addendum with signing flow.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 md:px-8 py-5 bg-surface-container-low flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href="/admin/tenants"
            className="w-full sm:w-auto text-center px-6 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-primary text-on-primary px-8 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">
                  progress_activity
                </span>
                {mode === "create" ? "Creating..." : "Sending..."}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">
                  {mode === "create" ? "person_add" : "send"}
                </span>
                {mode === "create" ? "Create Tenant Account" : "Send Invite Link"}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
