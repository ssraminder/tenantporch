"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createUtilityBill } from "@/app/admin/actions/utility-actions";
import { usePlanGate } from "@/components/shared/plan-gate-provider";

type Property = { id: string; address_line1: string; city: string };
type Lease = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  currency_code: string;
  utility_split_percent: number;
  status: string;
};

const UTILITY_TYPES = [
  { key: "electricity", label: "Electricity", icon: "bolt" },
  { key: "gas", label: "Gas", icon: "local_fire_department" },
  { key: "water", label: "Water", icon: "water_drop" },
  { key: "internet", label: "Internet", icon: "wifi" },
  { key: "sewer", label: "Sewer", icon: "plumbing" },
  { key: "trash", label: "Garbage", icon: "delete_sweep" },
  { key: "other", label: "Other", icon: "category" },
];

function getBillingPeriodDefault() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getDueDateDefault() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
}

export default function NewUtilityBillPage() {
  const router = useRouter();
  const { isAvailable, openFeatureGate } = usePlanGate();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filteredLeases, setFilteredLeases] = useState<Lease[]>([]);

  const [propertyId, setPropertyId] = useState("");
  const [leaseId, setLeaseId] = useState("");
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [utilityTypes, setUtilityTypes] = useState<string[]>(["electricity"]);
  const [billingPeriod, setBillingPeriod] = useState(getBillingPeriodDefault());
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(getDueDateDefault());
  const [sendNow, setSendNow] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: rpUser } = await supabase
          .from("rp_users").select("id").eq("auth_id", user.id).single();
        if (!rpUser) return;

        const { data: propData } = await supabase
          .from("rp_properties")
          .select("id, address_line1, city")
          .eq("landlord_id", rpUser.id)
          .order("address_line1");
        setProperties(propData ?? []);

        const ids = (propData ?? []).map((p) => p.id);
        if (ids.length > 0) {
          const { data: leaseData } = await supabase
            .from("rp_leases")
            .select("id, property_id, start_date, end_date, monthly_rent, currency_code, utility_split_percent, status")
            .in("property_id", ids)
            .order("start_date", { ascending: false });
          setLeases(leaseData ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (propertyId) {
      const filtered = leases.filter((l) => l.property_id === propertyId);
      // Sort: active first, then upcoming, then others
      filtered.sort((a, b) => {
        const priority = (s: string) => (s === "active" ? 0 : s === "upcoming" ? 1 : 2);
        return priority(a.status) - priority(b.status);
      });
      setFilteredLeases(filtered);
      if (filtered.length === 1) {
        setLeaseId(filtered[0].id);
      } else {
        setLeaseId("");
      }
    } else {
      setFilteredLeases([]);
      setLeaseId("");
    }
    setSelectedLease(null);
  }, [propertyId, leases]);

  useEffect(() => {
    const lease = leases.find((l) => l.id === leaseId) ?? null;
    setSelectedLease(lease);
  }, [leaseId, leases]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const added = files.filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...added].slice(0, 10);
    });
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propertyId || !leaseId) {
      setError("Please select a property and lease.");
      return;
    }
    if (utilityTypes.length === 0) {
      setError("Please select at least one utility type.");
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError("Please enter a valid total amount.");
      return;
    }

    setSubmitting(true);
    try {
      const splitPercent = selectedLease?.utility_split_percent ?? 0;
      const currency = selectedLease?.currency_code ?? "CAD";

      const formData = new FormData();
      formData.set("lease_id", leaseId);
      formData.set("property_id", propertyId);
      formData.set("utility_type", utilityTypes.join(","));
      formData.set("billing_period", billingPeriod);
      formData.set("total_amount", totalAmount);
      formData.set("split_percent", String(splitPercent));
      formData.set("currency_code", currency);
      formData.set("due_date", dueDate);
      formData.set("notes", notes);
      formData.set("send_now", sendNow ? "true" : "false");
      for (const file of selectedFiles) {
        formData.append("files", file);
      }

      const result = await createUtilityBill(formData);
      if (result.success) {
        toast.success(sendNow ? "Bill created and sent to tenant." : "Bill saved as draft.");
        router.push(`/admin/utilities/${result.billId}`);
      } else {
        setError(result.error ?? "Failed to create bill.");
        toast.error(result.error ?? "Failed to create bill.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const splitPercent = selectedLease?.utility_split_percent ?? 0;
  const total = parseFloat(totalAmount) || 0;
  const tenantAmount = parseFloat(((total * splitPercent) / 100).toFixed(2));
  const landlordAmount = parseFloat((total - tenantAmount).toFixed(2));
  const currency = selectedLease?.currency_code ?? "CAD";

  function fmtCurrency(v: number) {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(v);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAvailable("utility_splitting")) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/utilities" className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <h1 className="font-headline text-2xl font-extrabold text-primary">Add Utility Bill</h1>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-12 shadow-ambient-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-3xl text-on-secondary-container">lock</span>
          </div>
          <h2 className="font-headline text-xl font-extrabold text-primary mb-2">Utility Billing</h2>
          <p className="text-sm text-on-surface-variant max-w-sm mb-6">
            Utility billing is available on Starter plan and above.
          </p>
          <button
            onClick={() => openFeatureGate("utility_splitting")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            Upgrade to Starter
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/utilities"
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
            Add Utility Bill
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-0.5">
            Enter utility costs and send tenant their share
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-3 bg-error-container rounded-xl p-4">
            <span className="material-symbols-outlined text-on-error-container">error</span>
            <p className="text-sm font-medium text-on-error-container">{error}</p>
          </div>
        )}

        {/* ─── Step 1: Property + Lease ─── */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">1</div>
            <h2 className="font-headline font-bold text-lg text-primary">Property & Lease</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Property <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">apartment</span>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="">Select a property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address_line1}, {p.city}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">expand_more</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Lease <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">gavel</span>
                <select
                  value={leaseId}
                  onChange={(e) => setLeaseId(e.target.value)}
                  disabled={!propertyId}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {!propertyId ? "Select a property first" : filteredLeases.length === 0 ? "No leases found" : "Select a lease"}
                  </option>
                  {filteredLeases.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.start_date} {l.end_date ? `→ ${l.end_date}` : "(ongoing)"} — ${l.monthly_rent}/mo
                      {l.status !== "active" ? ` [${l.status}]` : ""}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">expand_more</span>
              </div>
              {selectedLease && (
                <p className="text-xs text-on-surface-variant mt-1.5">
                  Utility split: tenant pays{" "}
                  <strong className="text-secondary">{selectedLease.utility_split_percent}%</strong>
                  {selectedLease.utility_split_percent === 0 && (
                    <span className="ml-1 text-outline">— set a split % in the lease to charge tenant</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Step 2: Utility Type(s) ─── */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">2</div>
            <h2 className="font-headline font-bold text-lg text-primary">Utility Type</h2>
          </div>
          <p className="text-xs text-on-surface-variant -mt-2">
            Select one or more — e.g. water + garbage if billed together
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {UTILITY_TYPES.map((ut) => {
              const selected = utilityTypes.includes(ut.key);
              return (
                <button
                  key={ut.key}
                  type="button"
                  onClick={() => {
                    setUtilityTypes((prev) =>
                      selected
                        ? prev.filter((k) => k !== ut.key)
                        : [...prev, ut.key]
                    );
                  }}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl text-xs font-bold transition-all ${
                    selected
                      ? "bg-primary text-on-primary shadow-ambient-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {selected && (
                    <span className="absolute top-1 right-1 material-symbols-outlined text-xs">
                      check_circle
                    </span>
                  )}
                  <span className="material-symbols-outlined text-xl">{ut.icon}</span>
                  {ut.label}
                </button>
              );
            })}
          </div>
          {utilityTypes.length > 1 && (
            <p className="text-xs text-secondary font-semibold">
              Combined bill: {utilityTypes.map((k) => UTILITY_TYPES.find((u) => u.key === k)?.label).filter(Boolean).join(" + ")}
            </p>
          )}
        </div>

        {/* ─── Step 3: Billing Details ─── */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">3</div>
            <h2 className="font-headline font-bold text-lg text-primary">Bill Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Billing Period (Month)
              </label>
              <input
                type="month"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Total Bill Amount <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">attach_money</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Higher than usual due to cold month..."
              rows={2}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Split calculation preview */}
          {selectedLease && total > 0 && (
            <div className="bg-primary/5 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cost Breakdown</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest rounded-xl p-3 text-center">
                  <p className="text-xs text-on-surface-variant mb-1">Tenant pays ({splitPercent}%)</p>
                  <p className="text-lg font-extrabold font-headline text-primary">
                    {fmtCurrency(tenantAmount)}
                  </p>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-3 text-center">
                  <p className="text-xs text-on-surface-variant mb-1">Landlord covers ({100 - splitPercent}%)</p>
                  <p className="text-lg font-extrabold font-headline text-on-surface">
                    {fmtCurrency(landlordAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Step 4: File Uploads ─── */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">4</div>
            <h2 className="font-headline font-bold text-lg text-primary">
              Upload Bills{" "}
              <span className="text-sm font-normal text-on-surface-variant">(optional)</span>
            </h2>
          </div>

          <div>
            <label className="block w-full cursor-pointer border-2 border-dashed border-outline-variant/30 hover:border-primary/40 rounded-2xl p-6 text-center transition-colors">
              <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 block">upload_file</span>
              <p className="text-sm font-semibold text-on-surface-variant">
                Click to upload bills
              </p>
              <p className="text-xs text-on-surface-variant mt-1">PDF, JPG, PNG — up to 10 files</p>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-secondary text-lg">
                    {file.type.startsWith("image/") ? "image" : "picture_as_pdf"}
                  </span>
                  <p className="text-sm text-on-surface flex-1 truncate">{file.name}</p>
                  <p className="text-xs text-on-surface-variant flex-shrink-0">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-error hover:bg-error-container/20 rounded-lg p-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Step 5: Send Options ─── */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">5</div>
            <h2 className="font-headline font-bold text-lg text-primary">Due Date & Delivery</h2>
          </div>

          <div className="max-w-xs">
            <label className="block text-sm font-bold text-on-surface mb-2">Due Date</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">event</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              A 7-day reminder will be sent automatically if unpaid.
            </p>
          </div>

          <label className="flex items-start gap-3 bg-surface-container-low rounded-xl px-5 py-4 cursor-pointer">
            <input
              type="checkbox"
              checked={sendNow}
              onChange={(e) => setSendNow(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded accent-primary flex-shrink-0"
            />
            <div>
              <p className="text-sm font-bold text-primary">Send to tenant now</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                The tenant will receive an email and in-app notification with their share and due date. You can also send later from the bill detail page.
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/utilities"
            className="px-6 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !propertyId || !leaseId}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              {submitting ? "progress_activity" : sendNow ? "send" : "save"}
            </span>
            {submitting ? "Saving..." : sendNow ? "Save & Send to Tenant" : "Save as Draft"}
          </button>
        </div>
      </form>
    </section>
  );
}
