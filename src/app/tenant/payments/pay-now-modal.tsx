"use client";

import { useState, useEffect, useCallback } from "react";
import { submitTenantPayment } from "@/app/tenant/actions/payment-actions";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";

type PaymentMethodKey = "etransfer" | "cash" | "cheque" | "credit_card";

interface PayNowModalProps {
  open: boolean;
  onClose: () => void;
  amountDue: number;
  leaseId: string;
  currency: string;
  landlordEmail: string;
  propertyAddress: string;
  dueDateLabel: string;
}

export function PayNowModal({
  open,
  onClose,
  amountDue,
  leaseId,
  currency,
  landlordEmail,
  propertyAddress,
  dueDateLabel,
}: PayNowModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKey>("etransfer");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedMethod("etransfer");
      setNotes("");
      setSubmitting(false);
      setSubmitted(false);
      setCopied(false);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(landlordEmail);
      setCopied(true);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy email");
    }
  }, [landlordEmail]);

  async function handleCardPayment() {
    setSubmitting(true);
    try {
      // First record a pending payment
      const formData = new FormData();
      formData.append("lease_id", leaseId);
      formData.append("amount", String(amountDue));
      formData.append("payment_method", "credit_card");
      formData.append("notes", "Card payment via Stripe");

      const paymentResult = await submitTenantPayment(formData);
      if (!paymentResult.success) {
        toast.error(paymentResult.error ?? "Failed to initiate payment.");
        setSubmitting(false);
        return;
      }

      // Create Stripe Checkout session
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          amount: amountDue,
          paymentId: paymentResult.paymentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create checkout session");
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      toast.error("An unexpected error occurred.");
      setSubmitting(false);
    }
  }

  async function handleSubmitPayment() {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("lease_id", leaseId);
      formData.append("amount", String(amountDue));
      formData.append("payment_method", selectedMethod);
      formData.append("notes", notes);

      const result = await submitTenantPayment(formData);
      if (result.success) {
        setSubmitted(true);
        toast.success("Payment recorded successfully. Your landlord will confirm shortly.");
      } else {
        toast.error(result.error ?? "Failed to submit payment.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const methods: { key: PaymentMethodKey; label: string; icon: string; tag?: string }[] = [
    { key: "etransfer", label: "Interac E-Transfer", icon: "swap_horiz", tag: "No Fee" },
    { key: "cheque", label: "Cheque", icon: "mail", tag: "No Fee" },
    { key: "cash", label: "Cash", icon: "payments" },
    { key: "credit_card", label: "Credit / Debit Card", icon: "credit_card", tag: "Surcharge" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest rounded-t-3xl px-6 pt-6 pb-4 border-b border-outline-variant/10 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-headline font-extrabold text-primary tracking-tight">
                Pay Rent
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{propertyAddress}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Amount display */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-sm font-bold text-secondary">{currency}</span>
            <span className="text-3xl font-headline font-black text-primary tracking-tighter">
              {formatCurrency(amountDue, currency)}
            </span>
          </div>
          {dueDateLabel && (
            <p className="text-xs text-on-surface-variant mt-1">{dueDateLabel}</p>
          )}
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-tertiary-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-on-tertiary-container">
                check_circle
              </span>
            </div>
            <h3 className="text-lg font-headline font-bold text-primary mb-2">
              Payment Submitted
            </h3>
            <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
              Your {selectedMethod === "etransfer" ? "e-transfer" : selectedMethod} payment of{" "}
              {formatCurrency(amountDue, currency)} has been recorded as pending. Your landlord
              will confirm once received.
            </p>
            <button
              onClick={onClose}
              className="mt-8 px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="px-6 pb-6 pt-4">
            {/* Method Selector */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {methods.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMethod(m.key)}
                  className={`relative p-3 rounded-xl text-left transition-all ${
                    selectedMethod === m.key
                      ? "bg-secondary-container ring-2 ring-secondary"
                      : "bg-surface-container-low hover:bg-surface-bright"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-lg ${
                        selectedMethod === m.key ? "text-secondary" : "text-on-surface-variant"
                      }`}
                    >
                      {m.icon}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        selectedMethod === m.key ? "text-on-secondary-container" : "text-primary"
                      }`}
                    >
                      {m.label}
                    </span>
                  </div>
                  {m.tag && (
                    <span
                      className={`mt-1.5 inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        m.key === "credit_card"
                          ? "bg-surface-variant text-on-surface-variant"
                          : "bg-tertiary-fixed text-on-tertiary-fixed"
                      }`}
                    >
                      {m.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Method-specific Instructions */}
            <div className="bg-surface-container-low rounded-2xl p-5 mb-5">
              {selectedMethod === "etransfer" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-secondary text-lg">swap_horiz</span>
                    <h4 className="text-sm font-bold text-primary">E-Transfer Instructions</h4>
                  </div>

                  <div className="bg-surface-container-lowest rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Send to
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary flex-1 break-all">
                        {landlordEmail}
                      </span>
                      <button
                        onClick={handleCopyEmail}
                        className="flex-shrink-0 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {copied ? "check" : "content_copy"}
                        </span>
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <ol className="space-y-2 text-sm text-on-surface-variant">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <span>Open your banking app and select Interac e-Transfer</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <span>
                        Send <strong className="text-primary">{formatCurrency(amountDue, currency)}</strong> to the email above
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                        3
                      </span>
                      <span>
                        In the memo, write: <strong className="text-primary">{propertyAddress} - {dueDateLabel || "Rent"}</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                        4
                      </span>
                      <span>Once sent, click &quot;Confirm Payment Sent&quot; below</span>
                    </li>
                  </ol>
                </div>
              )}

              {selectedMethod === "cheque" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-secondary text-lg">mail</span>
                    <h4 className="text-sm font-bold text-primary">Cheque Instructions</h4>
                  </div>

                  <ol className="space-y-2 text-sm text-on-surface-variant">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <span>
                        Make cheque payable for <strong className="text-primary">{formatCurrency(amountDue, currency)}</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <span>Write your unit address and lease period on the memo line</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                        3
                      </span>
                      <span>Deliver or mail to your landlord. Contact them for mailing address if needed.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                        4
                      </span>
                      <span>Once mailed or delivered, click &quot;Confirm Payment Sent&quot; below</span>
                    </li>
                  </ol>

                  {/* Notes field for cheque */}
                  <div className="mt-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-primary font-medium outline-none focus:ring-2 focus:ring-secondary transition-all placeholder:text-on-surface-variant/40"
                      placeholder="e.g., Cheque #1234, mailed on April 10"
                    />
                  </div>
                </div>
              )}

              {selectedMethod === "cash" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-secondary text-lg">payments</span>
                    <h4 className="text-sm font-bold text-primary">Record Cash Payment</h4>
                  </div>

                  <p className="text-sm text-on-surface-variant">
                    Use this option if you paid or will pay rent in cash. This records a pending
                    payment that your landlord will confirm once they receive the funds.
                  </p>

                  <div className="mt-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-primary font-medium outline-none focus:ring-2 focus:ring-secondary transition-all resize-none placeholder:text-on-surface-variant/40"
                      placeholder="e.g., Handed cash to landlord on April 10. Received receipt."
                    />
                  </div>
                </div>
              )}

              {selectedMethod === "credit_card" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-secondary text-lg">credit_card</span>
                    <h4 className="text-sm font-bold text-primary">Pay by Card</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    Pay securely with credit or debit card via Stripe. A processing surcharge
                    will be applied at checkout.
                  </p>
                  <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">info</span>
                    <p className="text-xs text-on-surface-variant">
                      You&apos;ll be redirected to Stripe&apos;s secure checkout page to complete payment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes field for e-transfer */}
            {selectedMethod === "etransfer" && (
              <div className="mb-5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-primary font-medium outline-none focus:ring-2 focus:ring-secondary transition-all placeholder:text-on-surface-variant/40"
                  placeholder="e.g., Sent via TD app, reference #ABC123"
                />
              </div>
            )}

            {/* Submit button */}
            {selectedMethod === "credit_card" ? (
              <button
                onClick={handleCardPayment}
                disabled={submitting}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Pay with Card — {formatCurrency(amountDue, currency)}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmitPayment}
                disabled={submitting}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
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
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Confirm Payment Sent
                  </>
                )}
              </button>
            )}

            <p className="text-[10px] text-center text-on-surface-variant/50 mt-4 font-medium italic">
              Your landlord will confirm once payment is received
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
