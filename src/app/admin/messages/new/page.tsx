"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/admin/actions/message-actions";

type Tenant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  property_address: string;
  property_id: string;
};

const NOTICE_TYPES = [
  { value: "rent_increase", label: "Rent Increase" },
  { value: "lease_termination", label: "Lease Termination" },
  { value: "entry_notice", label: "Entry Notice" },
  { value: "eviction", label: "Eviction Notice" },
  { value: "inspection", label: "Inspection Notice" },
  { value: "maintenance", label: "Maintenance Notice" },
  { value: "other", label: "Other Notice" },
];

export default function NewMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTenantId = searchParams.get("tenant") || "";
  const supabase = createClient();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isFormalNotice, setIsFormalNotice] = useState(false);
  const [noticeType, setNoticeType] = useState("entry_notice");
  const [deliveryMethod, setDeliveryMethod] = useState("in_app");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenants() {
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

      // Get landlord's properties
      const { data: properties } = await supabase
        .from("rp_properties")
        .select("id, address_line1, city")
        .eq("landlord_id", rpUser.id);

      if (!properties?.length) {
        setLoading(false);
        return;
      }

      const propertyIds = properties.map((p) => p.id);

      // Get active leases for these properties
      const { data: leases } = await supabase
        .from("rp_leases")
        .select("id, property_id")
        .in("property_id", propertyIds)
        .eq("status", "active");

      if (!leases?.length) {
        setLoading(false);
        return;
      }

      const leaseIds = leases.map((l) => l.id);

      // Get tenants from lease_tenants
      const { data: leaseTenants } = await supabase
        .from("rp_lease_tenants")
        .select("user_id, lease_id, rp_users(id, first_name, last_name, email)")
        .in("lease_id", leaseIds);

      if (leaseTenants) {
        const mapped: Tenant[] = leaseTenants
          .filter((lt) => lt.rp_users)
          .map((lt) => {
            const u = lt.rp_users as any;
            const lease = leases.find((l) => l.id === lt.lease_id);
            const prop = properties.find(
              (p) => p.id === lease?.property_id
            );
            return {
              id: u.id,
              first_name: u.first_name || "",
              last_name: u.last_name || "",
              email: u.email || "",
              property_address: prop
                ? `${prop.address_line1}, ${prop.city}`
                : "",
              property_id: prop?.id ?? "",
            };
          });
        setTenants(mapped);
        if (initialTenantId && mapped.find((t) => t.id === initialTenantId)) {
          setRecipientId(initialTenantId);
        } else if (mapped.length === 1) {
          setRecipientId(mapped[0].id);
        }
      }
      setLoading(false);
    }
    loadTenants();
  }, []);

  const selectedTenant = tenants.find((t) => t.id === recipientId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!recipientId) {
      setError("Please select a recipient.");
      return;
    }
    if (!body.trim()) {
      setError("Message body is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("recipient_id", recipientId);
      formData.set("property_id", selectedTenant?.property_id ?? "");
      formData.set("subject", subject.trim());
      formData.set("body", body.trim());
      formData.set("is_formal_notice", String(isFormalNotice));
      formData.set("notice_type", noticeType);
      formData.set("delivery_method", deliveryMethod);

      const result = await sendMessage(formData);
      if (result.success) {
        toast.success("Message sent successfully");
        router.push("/admin/messages");
      } else {
        setError(result.error ?? "Failed to send message.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-on-surface-variant">Loading tenants...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/messages"
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Messages
        </Link>
      </div>

      <div>
        <h1 className="font-headline text-2xl font-bold text-primary flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl">edit_note</span>
          New Message
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Send a message or formal notice to a tenant
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-error-container/30 text-on-error-container p-4 rounded-xl">
          <span className="material-symbols-outlined text-lg mt-0.5">error</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              To <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                person
              </span>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
              >
                <option value="">Select a tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name} — {t.property_address}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              Subject
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject..."
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              Message <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
                chat
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={6}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>
          </div>

          {/* Formal Notice Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-error">
                  gavel
                </span>
                Formal Notice
              </p>
              <p className="text-xs text-on-surface-variant ml-7">
                Mark as a legally relevant notice (e.g. rent increase, entry notice)
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isFormalNotice}
              onClick={() => setIsFormalNotice(!isFormalNotice)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isFormalNotice ? "bg-error" : "bg-surface-container-highest"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  isFormalNotice ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Notice Type & Delivery Method (shown if formal notice) */}
          {isFormalNotice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
              <div>
                <label className="block text-sm font-bold text-primary mb-2">
                  Notice Type
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    assignment
                  </span>
                  <select
                    value={noticeType}
                    onChange={(e) => setNoticeType(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                  >
                    {NOTICE_TYPES.map((nt) => (
                      <option key={nt.value} value={nt.value}>
                        {nt.label}
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
                  Delivery Method
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    send
                  </span>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                  >
                    <option value="in_app">In-App</option>
                    <option value="email">Email</option>
                    <option value="mail">Physical Mail</option>
                    <option value="hand_delivered">Hand Delivered</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/messages"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">
              {submitting ? "hourglass_empty" : "send"}
            </span>
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </div>
      </form>
    </section>
  );
}
