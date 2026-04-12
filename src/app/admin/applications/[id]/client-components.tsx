"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  ApplicationActions                                                */
/* ------------------------------------------------------------------ */

export function ApplicationActions({
  applicationId,
  status,
  propertyId,
  applicantName,
  applicantEmail,
  moveInDate,
}: {
  applicationId: string;
  status: string;
  propertyId: string;
  applicantName: string;
  applicantEmail: string;
  moveInDate: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeclinePrompt, setShowDeclinePrompt] = useState(false);
  const [showInfoPrompt, setShowInfoPrompt] = useState(false);
  const [reason, setReason] = useState("");

  const canAct = status === "submitted" || status === "reviewing";

  async function handleAction(action: string, actionReason?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/applications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          action,
          reason: actionReason || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update application");
      }

      const result = await res.json();

      if (action === "approve") {
        if (result.tenantAccountCreated) {
          toast.success("Application approved — tenant account created and credentials emailed!");
        } else {
          toast.success("Application approved!");
        }
        const params = new URLSearchParams({
          propertyId,
          applicantName,
          applicantEmail,
          ...(moveInDate ? { moveIn: moveInDate } : {}),
        });
        router.push(`/admin/leases/new?${params.toString()}`);
      } else if (action === "decline") {
        toast.success("Application declined");
        router.refresh();
      } else if (action === "request_info") {
        toast.success("Status updated to reviewing");
        router.refresh();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
      setShowDeclinePrompt(false);
      setShowInfoPrompt(false);
      setReason("");
    }
  }

  if (!canAct) {
    const statusLabels: Record<string, { label: string; icon: string }> = {
      approved: { label: "This application has been approved.", icon: "check_circle" },
      declined: { label: "This application has been declined.", icon: "cancel" },
    };
    const info = statusLabels[status] ?? {
      label: `Status: ${status}`,
      icon: "info",
    };

    return (
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-surface-container-low">
        <span className="material-symbols-outlined text-on-surface-variant text-lg">
          {info.icon}
        </span>
        <p className="text-sm text-on-surface-variant">{info.label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Approve */}
      <button
        onClick={() => handleAction("approve")}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-lg">
          check_circle
        </span>
        Approve &amp; Create Lease
      </button>

      {/* Decline */}
      {!showDeclinePrompt ? (
        <button
          onClick={() => setShowDeclinePrompt(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-error-container text-on-error-container font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">cancel</span>
          Decline
        </button>
      ) : (
        <div className="rounded-xl border border-error/20 p-4 space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for declining (optional)..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-error/30 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("decline", reason)}
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-error text-on-error text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Declining..." : "Confirm Decline"}
            </button>
            <button
              onClick={() => {
                setShowDeclinePrompt(false);
                setReason("");
              }}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-outline-variant/20 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Request More Info */}
      {!showInfoPrompt ? (
        <button
          onClick={() => setShowInfoPrompt(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary-fixed/30 text-on-secondary-fixed-variant font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          Request More Info
        </button>
      ) : (
        <div className="rounded-xl border border-secondary/20 p-4 space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What additional info do you need?"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("request_info", reason)}
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
            <button
              onClick={() => {
                setShowInfoPrompt(false);
                setReason("");
              }}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-outline-variant/20 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LandlordNotes                                                     */
/* ------------------------------------------------------------------ */

export function LandlordNotes({
  applicationId,
  initialNotes,
}: {
  applicationId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const saveNotes = useCallback(
    async (value: string) => {
      if (value === initialNotes && !lastSaved) return;
      setSaving(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("rp_tenant_applications")
          .update({ landlord_notes: value })
          .eq("id", applicationId);

        if (error) throw error;
        setLastSaved(new Date().toLocaleTimeString());
      } catch {
        toast.error("Failed to save notes");
      } finally {
        setSaving(false);
      }
    },
    [applicationId, initialNotes, lastSaved]
  );

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => saveNotes(notes)}
        placeholder="Add private notes about this application..."
        rows={5}
        className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      />
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <span>Auto-saves on blur</span>
        {saving ? (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs animate-spin">
              progress_activity
            </span>
            Saving...
          </span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-tertiary-fixed-dim">
              check
            </span>
            Saved at {lastSaved}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RequestReferenceButton                                            */
/* ------------------------------------------------------------------ */

type ReferenceCheck = {
  id: string;
  referee_email?: string;
  status: string;
};

export function RequestReferenceButton({
  applicationId,
  refereeName,
  refereeEmail,
  refereePhone,
  relationship,
  existingRefs,
}: {
  applicationId: string;
  refereeName: string;
  refereeEmail: string;
  refereePhone: string;
  relationship: string;
  existingRefs: ReferenceCheck[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if a reference request already exists for this email
  const existing = existingRefs.find(
    (r) => r.referee_email === refereeEmail
  );

  if (existing) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-surface-container-low">
        <span className="material-symbols-outlined text-on-surface-variant text-sm">
          {existing.status === "completed" ? "check_circle" : "schedule_send"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-on-surface truncate">
            {refereeName}
          </p>
          <p className="text-xs text-on-surface-variant">
            {existing.status === "completed"
              ? "Reference received"
              : "Request sent"}
          </p>
        </div>
      </div>
    );
  }

  async function handleRequest() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Generate a simple token for the reference form link
      const token = crypto.randomUUID();

      const { error } = await supabase.from("rp_reference_checks").insert({
        application_id: applicationId,
        referee_name: refereeName,
        referee_email: refereeEmail,
        referee_phone: refereePhone || null,
        relationship,
        token,
        status: "sent",
      });

      if (error) throw error;

      toast.success(`Reference request created for ${refereeName}`);
      router.refresh();
    } catch {
      toast.error("Failed to create reference request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-colors disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-primary text-lg">
        send
      </span>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-semibold text-on-surface truncate">
          {refereeName}
        </p>
        <p className="text-xs text-on-surface-variant truncate">
          {refereeEmail}
        </p>
      </div>
      <span className="text-xs font-semibold text-primary whitespace-nowrap">
        {loading ? "Sending..." : "Request"}
      </span>
    </button>
  );
}
