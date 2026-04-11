"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const supabase = createClient();

  // Form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedLeaseId, setSelectedLeaseId] = useState("");
  const [role, setRole] = useState<"tenant" | "permitted_occupant">("tenant");

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
  useEffect(() => {
    if (selectedPropertyId) {
      setFilteredLeases(
        leases.filter((l) => l.property_id === selectedPropertyId)
      );
    } else {
      setFilteredLeases([]);
    }
    setSelectedLeaseId("");
  }, [selectedPropertyId, leases]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
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

    // Simulate API call delay
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 800);
  }

  function handleReset() {
    setEmail("");
    setFirstName("");
    setLastName("");
    setSelectedPropertyId("");
    setSelectedLeaseId("");
    setRole("tenant");
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
            Invite Tenant
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
            Invite Tenant
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
            Invitation Sent
          </h2>
          <p className="text-on-surface-variant mb-2">
            An invite link has been sent to <strong>{email}</strong>.
          </p>
          <p className="text-xs text-on-surface-variant mb-8">
            They will receive an email with instructions to create their account and access the tenant portal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Invite Another
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
            Invite Tenant
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Send an invite link to a new or existing tenant
          </p>
        </div>
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
                First Name
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
                Last Name
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
                onChange={(e) => setSelectedPropertyId(e.target.value)}
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
                Sending...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">send</span>
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
