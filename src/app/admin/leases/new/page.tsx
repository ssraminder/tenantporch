"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createLease } from "@/app/admin/actions/lease-actions";
import { usePlanGate } from "@/components/shared/plan-gate-provider";

type Property = {
  id: string;
  address_line1: string;
  city: string;
  monthly_rent: number | null;
};

export default function NewLeasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") || "";
  const supabase = createClient();
  const { isAvailable, openFeatureGate } = usePlanGate();

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [leaseType, setLeaseType] = useState<"fixed" | "month_to_month">("fixed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [currencyCode, setCurrencyCode] = useState("CAD");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [depositPaidDate, setDepositPaidDate] = useState("");
  const [utilitySplitPercent, setUtilitySplitPercent] = useState("40");
  const [internetIncluded, setInternetIncluded] = useState(true);
  const [padEnabled, setPadEnabled] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [maxOccupants, setMaxOccupants] = useState("3");
  const [lateFeeType, setLateFeeType] = useState("flat");
  const [lateFeeAmount, setLateFeeAmount] = useState("50");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
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
          .select("id, address_line1, city, monthly_rent")
          .eq("landlord_id", rpUser.id)
          .order("address_line1");
        setProperties(propData ?? []);

        // Fetch plan features
        const { data: landlordProfile } = await supabase
          .from("rp_landlord_profiles")
          .select("rp_plans(features)")
          .eq("user_id", rpUser.id)
          .single();
        const plan = landlordProfile?.rp_plans as any;
        setPlanFeatures(plan?.features ?? []);

        // Pre-fill rent if propertyId is provided
        if (initialPropertyId && propData) {
          const match = propData.find((p) => p.id === initialPropertyId);
          if (match?.monthly_rent) {
            setMonthlyRent(String(match.monthly_rent));
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When property selection changes, pre-fill monthly rent
  useEffect(() => {
    if (propertyId) {
      const match = properties.find((p) => p.id === propertyId);
      if (match?.monthly_rent) {
        setMonthlyRent(String(match.monthly_rent));
      }
    }
  }, [propertyId, properties]);

  const hasFeature = (feature: string) =>
    planFeatures.includes("all") || planFeatures.includes(feature);

  const backHref = initialPropertyId
    ? `/admin/properties/${initialPropertyId}`
    : "/admin/properties";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propertyId) {
      setError("Please select a property.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }
    if (leaseType === "fixed" && !endDate) {
      setError("End date is required for fixed-term leases.");
      return;
    }
    if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
      setError("Monthly rent is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("property_id", propertyId);
      formData.set("lease_type", leaseType);
      formData.set("start_date", startDate);
      formData.set("end_date", leaseType === "fixed" ? endDate : "");
      formData.set("monthly_rent", monthlyRent);
      formData.set("currency_code", currencyCode);
      formData.set("security_deposit", securityDeposit || "0");
      formData.set("deposit_paid_date", depositPaidDate);
      formData.set("utility_split_percent", utilitySplitPercent);
      formData.set("internet_included", String(internetIncluded));
      formData.set("pad_enabled", String(padEnabled));
      formData.set("pets_allowed", String(petsAllowed));
      formData.set("smoking_allowed", String(smokingAllowed));
      formData.set("max_occupants", maxOccupants);
      formData.set("late_fee_type", lateFeeType);
      formData.set("late_fee_amount", lateFeeType !== "none" ? lateFeeAmount : "0");

      const result = await createLease(formData);

      if (result.success && result.leaseId) {
        toast.success("Lease created — review the lease document.");
        router.push(`/admin/leases/${result.leaseId}/document`);
      } else {
        setError(result.error || "Failed to create lease.");
        toast.error(result.error || "Failed to create lease.");
      }
    } catch {
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAvailable("lease_builder")) {
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/properties"
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Create Lease
          </h1>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-primary">lock</span>
          </div>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">Custom Lease Builder</h2>
          <p className="text-sm text-on-surface-variant max-w-md mb-6">
            Build custom leases from province-specific templates with clause-by-clause editing. Available on all plans.
          </p>
          <button
            onClick={() => openFeatureGate("lease_builder")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">upgrade</span>
            View Details & Upgrade
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              arrow_back
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Create Lease
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

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Create Lease
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Set up a new lease agreement for a property
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
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
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

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Lease Type */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">
              Lease Type <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                htmlFor="type-fixed"
                className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  leaseType === "fixed"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  id="type-fixed"
                  type="radio"
                  name="leaseType"
                  value="fixed"
                  checked={leaseType === "fixed"}
                  onChange={() => setLeaseType("fixed")}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    leaseType === "fixed"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {leaseType === "fixed" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">Fixed Term</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Lease with a defined start and end date
                  </p>
                </div>
              </label>

              <label
                htmlFor="type-monthly"
                className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  leaseType === "month_to_month"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  id="type-monthly"
                  type="radio"
                  name="leaseType"
                  value="month_to_month"
                  checked={leaseType === "month_to_month"}
                  onChange={() => setLeaseType("month_to_month")}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    leaseType === "month_to_month"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {leaseType === "month_to_month" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">Month to Month</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Rolling lease with no fixed end date
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-bold text-primary mb-2"
              >
                Start Date <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  calendar_today
                </span>
                <input
                  id="startDate"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
            {leaseType === "fixed" && (
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-bold text-primary mb-2"
                >
                  End Date <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    event
                  </span>
                  <input
                    id="endDate"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Financial Terms heading */}
          <h2 className="text-lg font-headline font-bold text-primary">
            Financial Terms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Rent */}
            <div>
              <label
                htmlFor="monthlyRent"
                className="block text-sm font-bold text-primary mb-2"
              >
                Monthly Rent <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  attach_money
                </span>
                <input
                  id="monthlyRent"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-bold text-primary mb-2"
              >
                Currency
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  currency_exchange
                </span>
                <select
                  id="currency"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Security Deposit */}
            <div>
              <label
                htmlFor="securityDeposit"
                className="block text-sm font-bold text-primary mb-2"
              >
                Security Deposit
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  savings
                </span>
                <input
                  id="securityDeposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Deposit Paid Date */}
            <div>
              <label
                htmlFor="depositPaidDate"
                className="block text-sm font-bold text-primary mb-2"
              >
                Deposit Paid Date
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  calendar_today
                </span>
                <input
                  id="depositPaidDate"
                  type="date"
                  value={depositPaidDate}
                  onChange={(e) => setDepositPaidDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Utility Split */}
          <div className="max-w-xs">
            <label
              htmlFor="utilitySplit"
              className={`block text-sm font-bold mb-2 ${!hasFeature("utility_splitting") ? "text-on-surface-variant" : "text-primary"}`}
            >
              Tenant Utility Split %
            </label>
            {hasFeature("utility_splitting") ? (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  bolt
                </span>
                <input
                  id="utilitySplit"
                  type="number"
                  min="0"
                  max="100"
                  value={utilitySplitPercent}
                  onChange={(e) => setUtilitySplitPercent(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            ) : (
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-secondary-fixed-dim text-primary text-xs font-bold rounded-xl hover:bg-secondary-fixed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                Upgrade to unlock
              </Link>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Rules & Policies */}
          <h2 className="text-lg font-headline font-bold text-primary">
            Rules &amp; Policies
          </h2>

          <div className="space-y-4">
            {/* Internet Included */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Internet Included</p>
                <p className="text-xs text-on-surface-variant">Internet is provided with the rental</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={internetIncluded}
                  onChange={(e) => setInternetIncluded(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {/* PAD Enabled */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${!hasFeature("pad_auto_debit") ? "text-on-surface-variant" : "text-on-surface"}`}>Pre-Authorized Debit</p>
                <p className="text-xs text-on-surface-variant">Enable automatic bank withdrawals</p>
              </div>
              {hasFeature("pad_auto_debit") ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={padEnabled}
                    onChange={(e) => setPadEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              ) : (
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-fixed-dim text-primary text-xs font-bold rounded-xl hover:bg-secondary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Upgrade to unlock
                </Link>
              )}
            </div>

            {/* Pets Allowed */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Pets Allowed</p>
                <p className="text-xs text-on-surface-variant">Tenants may keep pets on the premises</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {/* Smoking Allowed */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Smoking Allowed</p>
                <p className="text-xs text-on-surface-variant">Smoking is permitted on the premises</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={smokingAllowed}
                  onChange={(e) => setSmokingAllowed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {/* Max Occupants */}
            <div className="max-w-xs">
              <label
                htmlFor="maxOccupants"
                className="block text-sm font-bold text-primary mb-2"
              >
                Max Occupants
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  group
                </span>
                <input
                  id="maxOccupants"
                  type="number"
                  min="1"
                  value={maxOccupants}
                  onChange={(e) => setMaxOccupants(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Late Fees */}
          <h2 className="text-lg font-headline font-bold text-primary">
            Late Fees
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Late Fee Type */}
            <div>
              <label
                htmlFor="lateFeeType"
                className="block text-sm font-bold text-primary mb-2"
              >
                Late Fee Type
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  receipt_long
                </span>
                <select
                  id="lateFeeType"
                  value={lateFeeType}
                  onChange={(e) => setLateFeeType(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                >
                  <option value="flat">Flat</option>
                  <option value="percentage">Percentage</option>
                  <option value="none">None</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Late Fee Amount */}
            {lateFeeType !== "none" && (
              <div>
                <label
                  htmlFor="lateFeeAmount"
                  className="block text-sm font-bold text-primary mb-2"
                >
                  Late Fee Amount {lateFeeType === "percentage" ? "(%)" : "($)"}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    {lateFeeType === "percentage" ? "percent" : "attach_money"}
                  </span>
                  <input
                    id="lateFeeAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={lateFeeAmount}
                    onChange={(e) => setLateFeeAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 md:px-8 py-5 bg-surface-container-low flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href={backHref}
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
                Creating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">gavel</span>
                Create Lease
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
