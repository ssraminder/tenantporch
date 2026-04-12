"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createAddendum } from "@/app/admin/actions/addendum-actions";
import { ADDENDUM_TYPE_LABELS } from "@/lib/lease-templates/alberta-addendum";

type Property = { id: string; address_line1: string; city: string };
type Lease = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  currency_code: string;
  status: string;
};

export default function NewAddendumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") || "";
  const initialLeaseId = searchParams.get("leaseId") || "";
  const initialType = searchParams.get("type") || "other";
  const initialOccupantName = searchParams.get("occupantName") || "";
  const supabase = createClient();

  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filteredLeases, setFilteredLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [leaseId, setLeaseId] = useState(initialLeaseId);
  const [addendumType, setAddendumType] = useState(initialType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [additionalRent, setAdditionalRent] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [effectiveTo, setEffectiveTo] = useState("");
  const [occupantName, setOccupantName] = useState(initialOccupantName);
  const [petDescription, setPetDescription] = useState("");
  const [sendForSigning, setSendForSigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-set title based on type
  useEffect(() => {
    if (addendumType && !title) {
      setTitle(ADDENDUM_TYPE_LABELS[addendumType] ?? "");
    }
  }, [addendumType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load properties + leases
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
            .select(
              "id, property_id, start_date, end_date, monthly_rent, currency_code, status"
            )
            .in("property_id", propertyIds)
            .in("status", ["active", "upcoming"])
            .order("start_date", { ascending: false });
          setLeases(leaseData ?? []);

          if (initialLeaseId && !initialPropertyId && leaseData) {
            const matched = leaseData.find((l) => l.id === initialLeaseId);
            if (matched) setPropertyId(matched.property_id);
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
      if (!filtered.find((l) => l.id === leaseId)) {
        setLeaseId(filtered.length === 1 ? filtered[0].id : "");
      }
    } else {
      setFilteredLeases([]);
      setLeaseId("");
    }
  }, [propertyId, leases]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propertyId || !leaseId) {
      setError("Please select a property and lease.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!effectiveFrom) {
      setError("Effective from date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("lease_id", leaseId);
      formData.set("addendum_type", addendumType);
      formData.set("title", title);
      formData.set("description", description);
      formData.set("additional_rent_amount", additionalRent || "0");
      formData.set("effective_from", effectiveFrom);
      if (effectiveTo) formData.set("effective_to", effectiveTo);
      if (occupantName) formData.set("occupant_name", occupantName);
      if (petDescription) formData.set("pet_description", petDescription);
      formData.set("send_for_signing", sendForSigning ? "true" : "false");

      const result = await createAddendum(formData);

      if (result.success) {
        toast.success(
          sendForSigning
            ? "Addendum created and sent for signatures."
            : "Addendum created as draft."
        );
        router.push(`/admin/properties/${propertyId}`);
      } else {
        setError(result.error ?? "Failed to create addendum.");
        toast.error(result.error ?? "Failed to create addendum.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedLease = leases.find((l) => l.id === leaseId);

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
            New Addendum
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
          href={propertyId ? `/admin/properties/${propertyId}` : "/admin/properties"}
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            New Addendum
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Create a lease addendum with optional additional rent
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden"
      >
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-3 bg-error-container rounded-xl p-4">
              <span className="material-symbols-outlined text-on-error-container">
                error
              </span>
              <p className="text-sm font-medium text-on-error-container">
                {error}
              </p>
            </div>
          )}

          {/* Property + Lease Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Property <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  apartment
                </span>
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
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Lease <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  gavel
                </span>
                <select
                  value={leaseId}
                  onChange={(e) => setLeaseId(e.target.value)}
                  disabled={!propertyId}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {propertyId
                      ? filteredLeases.length === 0
                        ? "No active leases"
                        : "Select a lease"
                      : "Select a property first"}
                  </option>
                  {filteredLeases.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.start_date}
                      {l.end_date ? ` to ${l.end_date}` : " (ongoing)"} — $
                      {l.monthly_rent}/mo
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-outline-variant/15" />

          {/* Addendum Type */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">
              Addendum Type <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(ADDENDUM_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setAddendumType(key);
                    setTitle(label);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    addendumType === key
                      ? "bg-primary text-on-primary shadow-ambient-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title + Description */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Additional Permitted Occupant"
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              Description <span className="text-error">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the amendment being made to the lease..."
              rows={3}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Type-specific fields */}
          {addendumType === "occupant" && (
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Occupant Full Name <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  person_add
                </span>
                <input
                  type="text"
                  value={occupantName}
                  onChange={(e) => setOccupantName(e.target.value)}
                  placeholder="Full legal name of the permitted occupant"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}

          {addendumType === "pet" && (
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Pet Description <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={petDescription}
                onChange={(e) => setPetDescription(e.target.value)}
                placeholder="e.g., 1 domestic cat, orange tabby, neutered"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div className="h-px bg-outline-variant/15" />

          {/* Dates + Rent */}
          <h2 className="text-lg font-headline font-bold text-primary">
            Effective Period & Charges
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Effective From <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  event
                </span>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Effective To{" "}
                <span className="text-on-surface-variant font-normal">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  event
                </span>
                <input
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  min={effectiveFrom}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Leave empty for ongoing (until lease termination). Rent reverts when this date passes.
              </p>
            </div>
          </div>

          <div>
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
                value={additionalRent}
                onChange={(e) => setAdditionalRent(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {selectedLease && additionalRent && parseFloat(additionalRent) > 0 && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-primary-fixed/10 rounded-xl">
                <span className="material-symbols-outlined text-primary text-lg">
                  info
                </span>
                <p className="text-sm text-on-surface">
                  Effective rent during addendum period:{" "}
                  <strong>
                    ${(
                      selectedLease.monthly_rent + parseFloat(additionalRent)
                    ).toFixed(2)}
                    /mo
                  </strong>{" "}
                  <span className="text-on-surface-variant">
                    (base ${selectedLease.monthly_rent.toFixed(2)} + $
                    {parseFloat(additionalRent).toFixed(2)} addendum)
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-outline-variant/15" />

          {/* Send for Signing Toggle */}
          <div className="flex items-start gap-3 bg-surface-container-low rounded-xl px-5 py-4">
            <input
              type="checkbox"
              id="send-for-signing"
              checked={sendForSigning}
              onChange={(e) => setSendForSigning(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded accent-primary flex-shrink-0"
            />
            <label
              htmlFor="send-for-signing"
              className="cursor-pointer"
            >
              <p className="text-sm font-bold text-primary">
                Send for signatures immediately
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                All lease parties will be notified and sent signing links. The addendum will be legally binding once all parties sign.
              </p>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-5 bg-surface-container-low flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href={
              propertyId
                ? `/admin/properties/${propertyId}`
                : "/admin/properties"
            }
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
                <span className="material-symbols-outlined text-sm">
                  post_add
                </span>
                Create Addendum
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
