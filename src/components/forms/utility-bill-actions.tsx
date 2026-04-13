"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  sendUtilityBillToTenant,
  sendUtilityReminder,
  recordUtilityPayment,
  cancelUtilityBill,
} from "@/app/admin/actions/utility-actions";

interface UtilityBillActionsProps {
  billId: string;
  status: string;
  canSendReminder: boolean;
  tenantAmount: string;
}

const PAYMENT_METHODS = [
  { key: "etransfer", label: "E-Transfer" },
  { key: "cash", label: "Cash" },
  { key: "cheque", label: "Cheque" },
  { key: "card", label: "Credit Card" },
];

export function UtilityBillActions({
  billId,
  status,
  canSendReminder,
  tenantAmount,
}: UtilityBillActionsProps) {
  const router = useRouter();
  const [sendingBill, setSendingBill] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("etransfer");
  const [etransferReference, setEtransferReference] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [recordingPayment, setRecordingPayment] = useState(false);

  async function handleSend() {
    setSendingBill(true);
    try {
      const result = await sendUtilityBillToTenant(billId);
      if (result.success) {
        toast.success("Bill sent to tenant.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to send bill.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSendingBill(false);
    }
  }

  async function handleReminder() {
    setSendingReminder(true);
    try {
      const result = await sendUtilityReminder(billId);
      if (result.success) {
        toast.success("Reminder sent to tenant.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to send reminder.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSendingReminder(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setRecordingPayment(true);
    try {
      const formData = new FormData();
      formData.set("payment_method", paymentMethod);
      formData.set("paid_date", paidDate);
      if (etransferReference) formData.set("etransfer_reference", etransferReference);

      const result = await recordUtilityPayment(billId, formData);
      if (result.success) {
        toast.success("Payment recorded successfully.");
        setShowPaymentForm(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to record payment.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setRecordingPayment(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this utility bill? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const result = await cancelUtilityBill(billId);
      if (result.success) {
        toast.success("Bill cancelled.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to cancel.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setCancelling(false);
    }
  }

  // Draft: show Send button + Cancel
  if (status === "draft") {
    return (
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-5 space-y-3">
        <h3 className="font-headline font-bold text-base text-on-surface">Actions</h3>
        <button
          onClick={handleSend}
          disabled={sendingBill}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">
            {sendingBill ? "progress_activity" : "send"}
          </span>
          {sendingBill ? "Sending..." : "Send to Tenant"}
        </button>
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-error hover:bg-error-container/20 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">cancel</span>
          {cancelling ? "Cancelling..." : "Cancel Bill"}
        </button>
      </div>
    );
  }

  // Sent or Overdue: reminder + mark paid
  if (status === "sent" || status === "overdue") {
    return (
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-5 space-y-3">
        <h3 className="font-headline font-bold text-base text-on-surface">Actions</h3>

        {status === "overdue" && (
          <div className="flex items-start gap-2 bg-error-container/20 rounded-xl p-3">
            <span className="material-symbols-outlined text-error text-lg flex-shrink-0">warning</span>
            <p className="text-xs text-on-error-container">
              This bill is overdue. Send a reminder to the tenant.
            </p>
          </div>
        )}

        {canSendReminder && (
          <button
            onClick={handleReminder}
            disabled={sendingReminder}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-on-secondary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {sendingReminder ? "progress_activity" : "notifications"}
            </span>
            {sendingReminder ? "Sending..." : "Send Reminder"}
          </button>
        )}

        {!showPaymentForm ? (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            Mark as Paid
          </button>
        ) : (
          <form onSubmit={handleRecordPayment} className="space-y-3 pt-2 border-t border-outline-variant/10">
            <p className="text-sm font-bold text-on-surface">Record Payment</p>
            <p className="text-xs text-on-surface-variant">
              Tenant amount: <strong>{tenantAmount}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Payment Method</label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {paymentMethod === "etransfer" && (
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Reference / Confirmation # (optional)
                </label>
                <input
                  type="text"
                  value={etransferReference}
                  onChange={(e) => setEtransferReference(e.target.value)}
                  placeholder="e.g. AB12345CD"
                  className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Payment Date</label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={recordingPayment}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  {recordingPayment ? "progress_activity" : "check_circle"}
                </span>
                {recordingPayment ? "Saving..." : "Confirm"}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Paid or Cancelled: no actions
  return null;
}
