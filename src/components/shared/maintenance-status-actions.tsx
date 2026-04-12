"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateMaintenanceStatus } from "@/app/admin/actions/maintenance-actions";

const STATUS_TRANSITIONS: Record<string, { status: string; label: string; icon: string; variant: "primary" | "cancel" }[]> = {
  submitted: [
    { status: "acknowledged", label: "Acknowledge", icon: "visibility", variant: "primary" },
    { status: "cancelled", label: "Cancel", icon: "cancel", variant: "cancel" },
  ],
  acknowledged: [
    { status: "in_progress", label: "Start Work", icon: "construction", variant: "primary" },
    { status: "cancelled", label: "Cancel", icon: "cancel", variant: "cancel" },
  ],
  in_progress: [
    { status: "scheduled", label: "Schedule", icon: "event", variant: "primary" },
    { status: "completed", label: "Complete", icon: "check_circle", variant: "primary" },
    { status: "cancelled", label: "Cancel", icon: "cancel", variant: "cancel" },
  ],
  scheduled: [
    { status: "completed", label: "Complete", icon: "check_circle", variant: "primary" },
    { status: "cancelled", label: "Cancel", icon: "cancel", variant: "cancel" },
  ],
};

const STATUS_LABELS: Record<string, { label: string; icon: string }> = {
  submitted: { label: "Submitted", icon: "inbox" },
  acknowledged: { label: "Acknowledged", icon: "visibility" },
  in_progress: { label: "In Progress", icon: "construction" },
  scheduled: { label: "Scheduled", icon: "event" },
  completed: { label: "Completed", icon: "check_circle" },
  cancelled: { label: "Cancelled", icon: "cancel" },
};

export function MaintenanceStatusActions({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingTo, setUpdatingTo] = useState<string | null>(null);

  const transitions = STATUS_TRANSITIONS[currentStatus];
  const statusInfo = STATUS_LABELS[currentStatus] ?? { label: currentStatus, icon: "help" };
  const isTerminal = currentStatus === "completed" || currentStatus === "cancelled";

  async function handleStatusChange(newStatus: string) {
    setUpdatingTo(newStatus);
    try {
      const result = await updateMaintenanceStatus(requestId, newStatus);
      if (result.success) {
        const newLabel = STATUS_LABELS[newStatus]?.label ?? newStatus;
        toast.success(`Status updated to ${newLabel}`);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setUpdatingTo(null);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-primary font-headline">Status</h3>

      {/* Current status large badge */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant">
          {statusInfo.icon}
        </span>
        <span className="text-lg font-bold text-on-surface capitalize">
          {statusInfo.label}
        </span>
      </div>

      {/* Terminal state message */}
      {isTerminal && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-container-low">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">
            {currentStatus === "completed" ? "task_alt" : "block"}
          </span>
          <p className="text-sm text-on-surface-variant">
            {currentStatus === "completed"
              ? "This request has been completed. No further actions available."
              : "This request has been cancelled. No further actions available."}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {transitions && transitions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {transitions.map((t) => {
            const isLoading = updatingTo === t.status;
            const disabled = isPending || updatingTo !== null;

            return (
              <button
                key={t.status}
                onClick={() => handleStatusChange(t.status)}
                disabled={disabled}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  t.variant === "cancel"
                    ? "bg-error-container text-on-error-container hover:opacity-90"
                    : "bg-primary text-on-primary hover:opacity-90"
                }`}
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-sm">
                    {t.icon}
                  </span>
                )}
                {isLoading ? "Updating..." : t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
