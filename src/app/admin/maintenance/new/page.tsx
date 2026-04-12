"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createMaintenanceRequest } from "@/app/admin/actions/maintenance-actions";

type Property = {
  id: string;
  address_line1: string;
  city: string;
};

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural" },
  { value: "pest_control", label: "Pest Control" },
  { value: "landscaping", label: "Landscaping" },
  { value: "cleaning", label: "Cleaning" },
  { value: "other", label: "Other" },
];

const URGENCY_LEVELS = [
  {
    value: "low",
    label: "Low",
    description: "Can be addressed when convenient",
    color: "bg-tertiary-fixed/15 text-on-tertiary-fixed-variant",
    activeRing: "ring-tertiary/30",
    activeBg: "bg-tertiary-fixed/25",
    dot: "bg-tertiary",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Should be handled within a few days",
    color: "bg-secondary-fixed/15 text-on-secondary-fixed-variant",
    activeRing: "ring-secondary/30",
    activeBg: "bg-secondary-fixed/25",
    dot: "bg-secondary",
  },
  {
    value: "high",
    label: "High",
    description: "Needs attention within 24 hours",
    color: "bg-error-container/40 text-on-error-container",
    activeRing: "ring-error/30",
    activeBg: "bg-error-container/60",
    dot: "bg-error",
  },
  {
    value: "emergency",
    label: "Emergency",
    description: "Immediate action required",
    color: "bg-error-container text-on-error-container",
    activeRing: "ring-error/50",
    activeBg: "bg-error-container",
    dot: "bg-error",
  },
];

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const supabase = createClient();

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [description, setDescription] = useState("");

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
          .select("id, address_line1, city")
          .eq("landlord_id", rpUser.id)
          .order("address_line1");
        setProperties(propData ?? []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propertyId) {
      setError("Please select a property.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("property_id", propertyId);
      formData.set("title", title.trim());
      formData.set("category", category);
      formData.set("urgency", urgency);
      formData.set("description", description.trim());

      const result = await createMaintenanceRequest(formData);

      if (result.success) {
        toast.success("Maintenance request submitted");
        router.push("/admin/maintenance");
      } else {
        setError(result.error || "Failed to submit request.");
        toast.error(result.error || "Failed to submit request.");
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
            href="/admin/maintenance"
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              arrow_back
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            New Maintenance Request
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
          href="/admin/maintenance"
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            New Maintenance Request
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Create a maintenance request for a property
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

          {/* Request Details heading */}
          <h2 className="text-lg font-headline font-bold text-primary">
            Request Details
          </h2>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-bold text-primary mb-2"
            >
              Title <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                build
              </span>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-bold text-primary mb-2"
            >
              Category
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                category
              </span>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">
              Urgency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {URGENCY_LEVELS.map((level) => (
                <label
                  key={level.value}
                  htmlFor={`urgency-${level.value}`}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all ${
                    urgency === level.value
                      ? `${level.activeBg} ring-2 ${level.activeRing}`
                      : "bg-surface-container-low hover:bg-surface-container-high"
                  }`}
                >
                  <input
                    id={`urgency-${level.value}`}
                    type="radio"
                    name="urgency"
                    value={level.value}
                    checked={urgency === level.value}
                    onChange={() => setUrgency(level.value)}
                    className="sr-only"
                  />
                  <div className={`w-3 h-3 rounded-full ${level.dot}`} />
                  <p className="text-sm font-bold text-on-surface">{level.label}</p>
                  <p className="text-[11px] text-on-surface-variant text-center leading-tight">
                    {level.description}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-bold text-primary mb-2"
            >
              Description <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
                notes
              </span>
              <textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={5}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 md:px-8 py-5 bg-surface-container-low flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href="/admin/maintenance"
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
                Submitting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">build</span>
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
