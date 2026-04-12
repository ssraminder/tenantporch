"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { renewLease } from "@/app/admin/actions/lease-actions";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { usePlanGate } from "@/components/shared/plan-gate-provider";

type LeaseData = {
  id: string;
  property_id: string;
  lease_type: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  currency_code: string;
  security_deposit: number | null;
  deposit_paid_date: string | null;
  utility_split_percent: number | null;
  internet_included: boolean;
  pad_enabled: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  max_occupants: number | null;
  late_fee_type: string | null;
  late_fee_amount: number | null;
  status: string;
  rp_properties: {
    address_line1: string;
    city: string;
  };
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function addOneYear(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export default function RenewLeasePage() {
  const router = useRouter();
  const params = useParams();
  const leaseId = params.id as string;
  const supabase = createClient();
  const { isAvailable, openFeatureGate } = usePlanGate();

  // Data state
  const [lease, setLease] = useState<LeaseData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
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

  // Load lease data on mount
  useEffect(() => {
    async function loadLease() {
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

        const { data: leaseData } = await supabase
          .from("rp_leases")
          .select(
            "id, property_id, lease_type, start_date, end_date, monthly_rent, currency_code, security_deposit, deposit_paid_date, utility_split_percent, internet_included, pad_enabled, pets_allowed, smoking_allowed, max_occupants, late_fee_type, late_fee_amount, status, rp_properties(address_line1, city, landlord_id)"
          )
          .eq("id", leaseId)
          .single();

        if (!leaseData) {
          setError("Lease not found");
          return;
        }

        const landlordId = (leaseData.rp_properties as any)?.landlord_id;
        if (landlordId !== rpUser.id) {
          setError("You do not own this lease");
          return;
        }

        setLease(leaseData as unknown as LeaseData);

        // Pre-fill form with renewal defaults
        const oldLeaseType = leaseData.lease_type as "fixed" | "month_to_month";
        setLeaseType(oldLeaseType);

        const today = new Date().toISOString().split("T")[0];
        const newStart = leaseData.end_date
          ? addDays(leaseData.end_date, 1)
          : today;
        setStartDate(newStart);

        if (oldLeaseType === "fixed") {
          setEndDate(addOneYear(newStart));
        } else {
          setEndDate("");
        }

        setMonthlyRent(String(leaseData.monthly_rent ?? ""));
        setCurrencyCode(leaseData.currency_code ?? "CAD");
        setSecurityDeposit(String(leaseData.security_deposit ?? ""));
        setDepositPaidDate("");
        setUtilitySplitPercent(String(leaseData.utility_split_percent ?? "40"));
        setInternetIncluded(leaseData.internet_included ?? true);
        setPadEnabled(leaseData.pad_enabled ?? false);
        setPetsAllowed(leaseData.pets_allowed ?? false);
        setSmokingAllowed(leaseData.smoking_allowed ?? false);
        setMaxOccupants(String(leaseData.max_occupants ?? "3"));
        setLateFeeType(leaseData.late_fee_type ?? "flat");
        setLateFeeAmount(String(leaseData.late_fee_amount ?? "50"));
      } finally {
        setLoading(false);
      }
    }
    loadLease();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const backHref = `/admin/leases/${leaseId}/edit`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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

      const result = await renewLease(leaseId, formData);

      if (result.success) {
        toast.success("Lease renewed successfully");
        router.push(`/admin/properties/${lease!.property_id}`);
      } else {
        setError(result.error || "Failed to renew lease.");
        toast.error(result.error || "Failed to renew lease.");
      }
    } catch {
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAvailable("lease_renewal")) {
    return (
      <section className="space-y-8">
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-primary">lock</span>
          </div>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">Lease Renewal</h2>
          <p className="text-sm text-on-surface-variant max-w-md mb-6">
            Streamlined lease renewal with automated reminders, term adjustments, and re-signing. Available on Growth and above.
          </p>
          <button
            onClick={() => openFeatureGate("lease_renewal")}
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
            href="/admin/properties"
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              arrow_back
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Renew Lease
          </h1>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient-sm flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin block mb-3">
              progress_activity
            </span>
            <p className="text-sm text-on-surface-variant">Loading lease...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!lease) {
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/properties"
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              arrow_back
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Lease Not Found
          </h1>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient-sm text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
            gavel
          </span>
          <p className="text-sm text-on-surface-variant">
            {error || "This lease doesn't exist or doesn't belong to your account."}
          </p>
        </div>
      </section>
    );
  }

  const propertyLabel = `${lease.rp_properties.address_line1}, ${lease.rp_properties.city}`;

  return (
    <section className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Properties", href: "/admin/properties", icon: "apartment" },
          { label: "Lease", href: backHref },
          { label: "Renew" },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
          Renew Lease
        </h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">
          Create a new lease to replace the current one for {propertyLabel}
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

          {/* Property (read-only) */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              Property
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                apartment
              </span>
              <div className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface-variant cursor-not-allowed">
                {propertyLabel}
              </div>
            </div>
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
              className="block text-sm font-bold text-primary mb-2"
            >
              Tenant Utility Split %
            </label>
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
                <p className="text-sm font-bold text-on-surface">Pre-Authorized Debit</p>
                <p className="text-xs text-on-surface-variant">Enable automatic bank withdrawals</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={padEnabled}
                  onChange={(e) => setPadEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
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
                Renewing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">autorenew</span>
                Renew Lease
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
