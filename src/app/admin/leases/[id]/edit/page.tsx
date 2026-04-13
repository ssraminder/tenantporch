"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateLease, terminateLease } from "@/app/admin/actions/lease-actions";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

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

export default function EditLeasePage() {
  const router = useRouter();
  const params = useParams();
  const leaseId = params.id as string;
  const supabase = createClient();

  // Data state
  const [lease, setLease] = useState<LeaseData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
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
  const [terminating, setTerminating] = useState(false);
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
            "id, property_id, lease_type, start_date, end_date, monthly_rent, currency_code, security_deposit, deposit_paid_date, utility_split_percent, internet_included, pad_enabled, pets_allowed, smoking_allowed, max_occupants, late_fee_type, late_fee_amount, status, signing_status, rp_properties(address_line1, city, landlord_id)"
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

        // Block editing if lease is signed
        if ((leaseData as any).signing_status === "completed") {
          setError("This lease has been signed and cannot be edited.");
          return;
        }

        setLease(leaseData as unknown as LeaseData);

        // Pre-fill form fields
        setEndDate(leaseData.end_date ?? "");
        setMonthlyRent(String(leaseData.monthly_rent ?? ""));
        setSecurityDeposit(String(leaseData.security_deposit ?? ""));
        setDepositPaidDate(leaseData.deposit_paid_date ?? "");
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

  const backHref = lease ? `/admin/properties/${lease.property_id}` : "/admin/properties";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
      setError("Monthly rent is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("end_date", endDate);
      formData.set("monthly_rent", monthlyRent);
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

      const result = await updateLease(leaseId, formData);

      if (result.success) {
        toast.success("Lease updated successfully");
        router.push(`/admin/properties/${lease!.property_id}`);
      } else {
        setError(result.error || "Failed to update lease.");
        toast.error(result.error || "Failed to update lease.");
      }
    } catch {
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTerminate() {
    if (!confirm("Are you sure you want to terminate this lease? This will set the lease status to terminated and the end date to today. This action cannot be undone.")) {
      return;
    }

    setTerminating(true);
    try {
      const result = await terminateLease(leaseId);

      if (result.success) {
        toast.success("Lease terminated successfully");
        router.push(`/admin/properties/${lease!.property_id}`);
      } else {
        toast.error(result.error || "Failed to terminate lease.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setTerminating(false);
    }
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
            Edit Lease
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
  const leaseTypeLabel = lease.lease_type === "fixed" ? "Fixed Term" : "Month to Month";

  return (
    <section className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Properties", href: "/admin/properties", icon: "apartment" },
          { label: "Lease", href: backHref },
          { label: "Edit" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Edit Lease
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Modify lease terms for {propertyLabel}
          </p>
        </div>
        {(lease.status === "active" || lease.status === "expired") && (
          <Link
            href={`/admin/leases/${leaseId}/renew`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">autorenew</span>
            Renew Lease
          </Link>
        )}
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

          {/* Lease Type (read-only) */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">
              Lease Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`relative flex items-start gap-3 p-4 rounded-xl ${
                  lease.lease_type === "fixed"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low opacity-50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    lease.lease_type === "fixed"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {lease.lease_type === "fixed" && (
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
              </div>

              <div
                className={`relative flex items-start gap-3 p-4 rounded-xl ${
                  lease.lease_type === "month_to_month"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low opacity-50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    lease.lease_type === "month_to_month"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {lease.lease_type === "month_to_month" && (
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
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              Lease type cannot be changed after creation.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date (read-only) */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Start Date
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  calendar_today
                </span>
                <div className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface-variant cursor-not-allowed">
                  {lease.start_date}
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Start date cannot be changed.
              </p>
            </div>

            {/* End Date (editable) */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-bold text-primary mb-2"
              >
                End Date
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  event
                </span>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
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

            {/* Currency (read-only) */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Currency
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  currency_exchange
                </span>
                <div className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface-variant cursor-not-allowed">
                  {lease.currency_code}
                </div>
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
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Danger Zone: Terminate Lease */}
      {lease.status === "active" && (
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
              Terminating a lease will immediately end it and set the end date to today.
              This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={handleTerminate}
              disabled={terminating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {terminating ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">
                    progress_activity
                  </span>
                  Terminating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    gavel
                  </span>
                  Terminate Lease
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
