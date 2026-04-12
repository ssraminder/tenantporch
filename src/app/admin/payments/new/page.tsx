"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { recordPayment } from "@/app/admin/actions/payment-actions";

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
  currency_code: string;
};

type Tenant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") || "";
  const initialLeaseId = searchParams.get("leaseId") || searchParams.get("lease") || "";
  const initialTenantId = searchParams.get("tenant") || "";
  const supabase = createClient();

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filteredLeases, setFilteredLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [leaseId, setLeaseId] = useState(initialLeaseId);
  const [tenantId, setTenantId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("etransfer");
  const [paymentType, setPaymentType] = useState("rent");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentForMonth, setPaymentForMonth] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [notes, setNotes] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load landlord's properties and leases on mount
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
            .select("id, property_id, start_date, end_date, status, monthly_rent, currency_code")
            .in("property_id", propertyIds)
            .order("start_date", { ascending: false });
          setLeases(leaseData ?? []);

          // If we have a lease param but no property param, derive property from lease
          if (initialLeaseId && !initialPropertyId && leaseData) {
            const matchedLease = leaseData.find((l) => l.id === initialLeaseId);
            if (matchedLease) {
              setPropertyId(matchedLease.property_id);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter leases when property changes
  useEffect(() => {
    if (propertyId) {
      const filtered = leases.filter((l) => l.property_id === propertyId);
      setFilteredLeases(filtered);
      // Keep leaseId only if it belongs to this property
      if (!filtered.find((l) => l.id === leaseId)) {
        setLeaseId("");
      }
    } else {
      setFilteredLeases([]);
      setLeaseId("");
    }
  }, [propertyId, leases]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch tenants when lease changes, and pre-fill amount from lease rent
  useEffect(() => {
    if (!leaseId) {
      setTenants([]);
      setTenantId("");
      return;
    }

    // Pre-fill amount from lease's monthly_rent + active addendums
    const lease = leases.find((l) => l.id === leaseId);
    if (lease?.monthly_rent) {
      // Fetch active addendum rent for this lease
      const todayStr = new Date().toISOString().split("T")[0];
      supabase
        .from("rp_addendums")
        .select("additional_rent_amount, effective_from, effective_to")
        .eq("lease_id", leaseId)
        .eq("status", "signed")
        .lte("effective_from", todayStr)
        .then(({ data: addendums }) => {
          const addendumRent = (addendums ?? [])
            .filter((a) => !a.effective_to || a.effective_to >= todayStr)
            .reduce((sum, a) => sum + Number(a.additional_rent_amount ?? 0), 0);
          setAmount(String(lease.monthly_rent + addendumRent));
        });
    }

    async function loadTenants() {
      const { data: leaseTenants } = await supabase
        .from("rp_lease_tenants")
        .select("tenant_id, rp_users(id, first_name, last_name, email)")
        .eq("lease_id", leaseId);

      if (leaseTenants) {
        const mapped: Tenant[] = leaseTenants
          .filter((lt) => lt.rp_users)
          .map((lt) => {
            const u = lt.rp_users as any;
            return {
              id: u.id,
              first_name: u.first_name || "",
              last_name: u.last_name || "",
              email: u.email || "",
            };
          });
        setTenants(mapped);
        if (initialTenantId && mapped.find((t) => t.id === initialTenantId)) {
          setTenantId(initialTenantId);
        } else if (mapped.length === 1) {
          setTenantId(mapped[0].id);
        } else {
          setTenantId("");
        }
      }
    }
    loadTenants();
  }, [leaseId, leases]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propertyId) {
      setError("Please select a property.");
      return;
    }
    if (!leaseId) {
      setError("Please select a lease.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Amount is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("lease_id", leaseId);
      formData.set("tenant_id", tenantId);
      formData.set("amount", amount);
      formData.set("payment_method", paymentMethod);
      formData.set("payment_type", paymentType);
      formData.set("paid_date", paidDate);
      // Convert YYYY-MM to YYYY-MM-01
      formData.set(
        "payment_for_month",
        paymentForMonth ? `${paymentForMonth}-01` : ""
      );
      formData.set("status", status);
      formData.set("notes", notes);

      // Get currency from selected lease
      const lease = leases.find((l) => l.id === leaseId);
      formData.set("currency_code", lease?.currency_code || "CAD");

      const result = await recordPayment(formData);

      if (result.success) {
        toast.success("Payment recorded successfully");
        router.push("/admin/financials");
      } else {
        setError(result.error || "Failed to record payment.");
        toast.error(result.error || "Failed to record payment.");
      }
    } catch {
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/financials"
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              arrow_back
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Record Payment
          </h1>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient-sm flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin block mb-3">
              progress_activity
            </span>
            <p className="text-sm text-on-surface-variant">Loading data...</p>
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
          href="/admin/financials"
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Record Payment
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Manually record a rent payment from a tenant
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
                value={leaseId}
                onChange={(e) => setLeaseId(e.target.value)}
                disabled={!propertyId}
                className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {propertyId
                    ? filteredLeases.length === 0
                      ? "No leases for this property"
                      : "Select a lease"
                    : "Select a property first"}
                </option>
                {filteredLeases.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.start_date}
                    {l.end_date ? ` to ${l.end_date}` : " (ongoing)"} &mdash;{" "}
                    {l.status.charAt(0).toUpperCase() + l.status.slice(1)} &mdash; $
                    {l.monthly_rent}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Tenant select */}
          <div>
            <label
              htmlFor="tenant"
              className="block text-sm font-bold text-primary mb-2"
            >
              Tenant <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                person
              </span>
              <select
                id="tenant"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                disabled={!leaseId}
                className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {leaseId
                    ? tenants.length === 0
                      ? "No tenants on this lease"
                      : "Select a tenant"
                    : "Select a lease first"}
                </option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                    {t.email ? ` (${t.email})` : ""}
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

          {/* Payment Details heading */}
          <h2 className="text-lg font-headline font-bold text-primary">
            Payment Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-bold text-primary mb-2"
              >
                Amount <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  attach_money
                </span>
                <input
                  id="amount"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-bold text-primary mb-2"
              >
                Payment Method
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  payments
                </span>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                >
                  <option value="etransfer">E-Transfer</option>
                  <option value="card">Card</option>
                  <option value="pad">Pre-Authorized Debit</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label
                htmlFor="paymentType"
                className="block text-sm font-bold text-primary mb-2"
              >
                Payment Type <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  category
                </span>
                <select
                  id="paymentType"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                >
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="deposit">Security Deposit</option>
                  <option value="late_fee">Late Fee</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Paid Date */}
            <div>
              <label
                htmlFor="paidDate"
                className="block text-sm font-bold text-primary mb-2"
              >
                Payment Date <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  event
                </span>
                <input
                  id="paidDate"
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Payment For Month */}
            <div>
              <label
                htmlFor="paymentForMonth"
                className="block text-sm font-bold text-primary mb-2"
              >
                Payment For Month
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  calendar_month
                </span>
                <input
                  id="paymentForMonth"
                  type="month"
                  value={paymentForMonth}
                  onChange={(e) => setPaymentForMonth(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Status */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">
              Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                htmlFor="status-confirmed"
                className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  status === "confirmed"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  id="status-confirmed"
                  type="radio"
                  name="status"
                  value="confirmed"
                  checked={status === "confirmed"}
                  onChange={() => setStatus("confirmed")}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    status === "confirmed"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {status === "confirmed" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">Confirmed</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Payment has been received and verified
                  </p>
                </div>
              </label>

              <label
                htmlFor="status-pending"
                className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  status === "pending"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  id="status-pending"
                  type="radio"
                  name="status"
                  value="pending"
                  checked={status === "pending"}
                  onChange={() => setStatus("pending")}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    status === "pending"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {status === "pending" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">Pending</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Payment is expected but not yet confirmed
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-bold text-primary mb-2"
            >
              Notes
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
                notes
              </span>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this payment..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 md:px-8 py-5 bg-surface-container-low flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href="/admin/financials"
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
                Recording...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">payments</span>
                Record Payment
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
