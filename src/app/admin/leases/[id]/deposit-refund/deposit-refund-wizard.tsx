"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { DateDisplay } from "@/components/shared/date-display";

type DepositData = {
  id: string;
  amount: number;
  interest_accrued: number;
  received_date: string;
  currency_code: string;
};

type TenantData = {
  first_name: string;
  last_name: string;
  email: string;
};

type LeaseData = {
  id: string;
  property_id: string;
  rp_properties: {
    address_line1: string;
    city: string;
  };
};

type DeductionRow = {
  id: string;
  category: string;
  description: string;
  amount: string;
  evidenceUrl: string;
  uploading: boolean;
};

const REFUND_REASONS = [
  { value: "did_not_proceed", label: "Tenant did not proceed with lease" },
  { value: "end_of_lease", label: "End of lease \u2014 normal move-out" },
  { value: "early_termination", label: "Early lease termination" },
  { value: "mutual_agreement", label: "Mutual agreement" },
  { value: "other", label: "Other" },
];

const DEDUCTION_CATEGORIES = [
  { value: "rent_arrears", label: "Unpaid rent" },
  { value: "utilities", label: "Unpaid utilities" },
  { value: "cleaning", label: "Cleaning" },
  { value: "damage", label: "Damages / repairs" },
  { value: "other:lock_key", label: "Lock/key replacement" },
  { value: "other:lease_break", label: "Lease break fee" },
  { value: "other", label: "Other" },
];

function mapCategoryToDb(value: string): string {
  if (value.startsWith("other:")) return "other";
  return value;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

const STEPS = ["Deposit Summary", "Refund Amount", "Deductions", "Review & Confirm"];

export function DepositRefundWizard({
  lease,
  deposit,
  tenant,
}: {
  lease: LeaseData;
  deposit: DepositData;
  tenant: TenantData | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const currency = deposit.currency_code;
  const totalAvailable = deposit.amount + (deposit.interest_accrued ?? 0);

  // Wizard step
  const [step, setStep] = useState(0);

  // Step 1 — reason
  const [refundReason, setRefundReason] = useState("");
  const [refundReasonOther, setRefundReasonOther] = useState("");

  // Step 2 — refund type
  const [refundType, setRefundType] = useState<"full" | "partial" | "">("");
  const [refundAmount, setRefundAmount] = useState("");

  // Step 3 — deductions
  const [deductions, setDeductions] = useState<DeductionRow[]>([
    {
      id: generateId(),
      category: "",
      description: "",
      amount: "",
      evidenceUrl: "",
      uploading: false,
    },
  ]);

  // Step 4 — return method
  const [returnMethod, setReturnMethod] = useState("");
  const [returnReference, setReturnReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Computed
  const parsedRefund = parseFloat(refundAmount) || 0;
  const withheld = totalAvailable - parsedRefund;

  const deductionTotal = useMemo(
    () => deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
    [deductions]
  );

  const remaining = withheld - deductionTotal;
  const isBalanced = Math.abs(remaining) < 0.01;

  const propertyAddress = `${lease.rp_properties.address_line1}, ${lease.rp_properties.city}`;

  // --- Step validation ---
  function canProceedStep0() {
    if (!refundReason) return false;
    if (refundReason === "other" && !refundReasonOther.trim()) return false;
    return true;
  }

  function canProceedStep1() {
    if (!refundType) return false;
    if (refundType === "partial") {
      const amt = parseFloat(refundAmount);
      if (isNaN(amt) || amt < 0 || amt > totalAvailable) return false;
    }
    return true;
  }

  function canProceedStep2() {
    if (deductions.length === 0) return false;
    for (const d of deductions) {
      if (!d.category || !d.description.trim() || !d.amount) return false;
      const amt = parseFloat(d.amount);
      if (isNaN(amt) || amt <= 0) return false;
    }
    return isBalanced;
  }

  // --- Handlers ---
  function handleNext() {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (refundType === "full") {
        setRefundAmount(totalAvailable.toFixed(2));
        // Skip deductions, go to review
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    }
  }

  function handleBack() {
    if (step === 3 && refundType === "full") {
      setStep(1);
    } else {
      setStep(step - 1);
    }
  }

  function addDeduction() {
    setDeductions((prev) => [
      ...prev,
      {
        id: generateId(),
        category: "",
        description: "",
        amount: "",
        evidenceUrl: "",
        uploading: false,
      },
    ]);
  }

  function removeDeduction(id: string) {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  }

  function updateDeduction(
    id: string,
    field: keyof DeductionRow,
    value: string | boolean
  ) {
    setDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  }

  async function handleFileUpload(deductionId: string, file: File) {
    updateDeduction(deductionId, "uploading", true as unknown as string);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `deposit-evidence/${lease.id}/${deductionId}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("rp-documents")
        .upload(fileName, file, { upsert: true });

      if (error) {
        toast.error("Failed to upload file");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("rp-documents").getPublicUrl(data.path);

      updateDeduction(deductionId, "evidenceUrl", publicUrl);
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setDeductions((prev) =>
        prev.map((d) =>
          d.id === deductionId ? { ...d, uploading: false } : d
        )
      );
    }
  }

  async function handleSubmit() {
    if (!confirmed) return;
    setSubmitting(true);

    try {
      const payload = {
        leaseId: lease.id,
        depositId: deposit.id,
        refundReason,
        refundReasonOther,
        refundType,
        refundAmount:
          refundType === "full"
            ? totalAvailable.toFixed(2)
            : refundAmount,
        deductions:
          refundType === "full"
            ? []
            : deductions.map((d) => ({
                category: mapCategoryToDb(d.category),
                description: d.description,
                amount: d.amount,
                evidenceUrl: d.evidenceUrl || null,
                evidenceUrls: d.evidenceUrl ? [d.evidenceUrl] : [],
              })),
        returnMethod,
        returnReference,
        evidenceUrls: deductions
          .filter((d) => d.evidenceUrl)
          .map((d) => d.evidenceUrl),
      };

      const res = await fetch("/api/deposits/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to process deposit return");
        return;
      }

      toast.success("Deposit return statement sent successfully");
      router.push(`/admin/properties/${lease.property_id}`);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  // The final refund to display in review
  const finalRefund =
    refundType === "full" ? totalAvailable : parsedRefund;
  const finalDeductions =
    refundType === "full" ? 0 : totalAvailable - finalRefund;

  const reasonLabel =
    refundReason === "other"
      ? refundReasonOther
      : REFUND_REASONS.find((r) => r.value === refundReason)?.label ?? "";

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((label, i) => {
            // Skip step 2 (deductions) if full refund
            if (i === 2 && refundType === "full") return null;

            const isActive = i === step;
            const isCompleted = i < step;

            return (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                {i > 0 && !(i === 2 && refundType === "full") && (
                  <div
                    className={`hidden sm:block w-8 h-0.5 ${
                      isCompleted
                        ? "bg-primary"
                        : "bg-outline-variant/30"
                    }`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isActive
                        ? "bg-primary text-on-primary"
                        : isCompleted
                          ? "bg-primary/20 text-primary"
                          : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-sm">
                        check
                      </span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${
                      isActive
                        ? "text-primary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 0 — Deposit Summary */}
      {step === 0 && (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary">
              savings
            </span>
            <h2 className="font-headline font-bold text-xl text-primary">
              Deposit Summary
            </h2>
          </div>

          {/* Deposit info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-low rounded-2xl p-4">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Original Deposit
              </p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(deposit.amount, currency)}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Date Received
              </p>
              <p className="text-lg font-bold text-on-surface">
                <DateDisplay date={deposit.received_date} format="medium" />
              </p>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Interest Accrued
              </p>
              <p className="text-lg font-bold text-on-surface">
                {formatCurrency(deposit.interest_accrued ?? 0, currency)}
              </p>
            </div>
            <div className="bg-primary/5 rounded-2xl p-4">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Total Available
              </p>
              <p className="text-lg font-extrabold text-primary">
                {formatCurrency(totalAvailable, currency)}
              </p>
            </div>
          </div>

          {tenant && (
            <div className="bg-surface-container-low rounded-2xl p-4">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2">
                Tenant
              </p>
              <p className="text-sm font-bold text-on-surface">
                {tenant.first_name} {tenant.last_name}
              </p>
              <p className="text-sm text-on-surface-variant">{tenant.email}</p>
            </div>
          )}

          {/* Refund reason */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">
              Reason for Deposit Return <span className="text-error">*</span>
            </label>
            <div className="space-y-2">
              {REFUND_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                    refundReason === reason.value
                      ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                      : "bg-surface-container-low hover:bg-surface-container-high"
                  }`}
                >
                  <input
                    type="radio"
                    name="refundReason"
                    value={reason.value}
                    checked={refundReason === reason.value}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      refundReason === reason.value
                        ? "bg-primary"
                        : "bg-surface-container-highest"
                    }`}
                  >
                    {refundReason === reason.value && (
                      <span className="material-symbols-outlined text-on-primary text-xs">
                        check
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>

            {refundReason === "other" && (
              <div className="mt-3">
                <input
                  type="text"
                  value={refundReasonOther}
                  onChange={(e) => setRefundReasonOther(e.target.value)}
                  placeholder="Please describe the reason..."
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            )}
          </div>

          {/* Next */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              disabled={!canProceedStep0()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Step 1 — Refund Amount */}
      {step === 1 && (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary">
              account_balance_wallet
            </span>
            <h2 className="font-headline font-bold text-xl text-primary">
              Refund Amount
            </h2>
          </div>

          <p className="text-sm text-on-surface-variant">
            Total available for refund:{" "}
            <span className="font-bold text-primary">
              {formatCurrency(totalAvailable, currency)}
            </span>
          </p>

          {/* Full vs Partial */}
          <div className="space-y-3">
            <label
              className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                refundType === "full"
                  ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                  : "bg-surface-container-low hover:bg-surface-container-high"
              }`}
            >
              <input
                type="radio"
                name="refundType"
                value="full"
                checked={refundType === "full"}
                onChange={() => {
                  setRefundType("full");
                  setRefundAmount(totalAvailable.toFixed(2));
                }}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  refundType === "full"
                    ? "bg-primary"
                    : "bg-surface-container-highest"
                }`}
              >
                {refundType === "full" && (
                  <span className="material-symbols-outlined text-on-primary text-xs">
                    check
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Full Refund</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Return the entire deposit + interest (
                  {formatCurrency(totalAvailable, currency)})
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                refundType === "partial"
                  ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                  : "bg-surface-container-low hover:bg-surface-container-high"
              }`}
            >
              <input
                type="radio"
                name="refundType"
                value="partial"
                checked={refundType === "partial"}
                onChange={() => {
                  setRefundType("partial");
                  setRefundAmount("");
                }}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  refundType === "partial"
                    ? "bg-primary"
                    : "bg-surface-container-highest"
                }`}
              >
                {refundType === "partial" && (
                  <span className="material-symbols-outlined text-on-primary text-xs">
                    check
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  Partial Refund
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Withhold deductions and refund the remainder
                </p>
              </div>
            </label>
          </div>

          {/* Partial amount input */}
          {refundType === "partial" && (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="refundAmount"
                  className="block text-sm font-bold text-primary mb-2"
                >
                  Refund Amount <span className="text-error">*</span>
                </label>
                <div className="relative max-w-xs">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    attach_money
                  </span>
                  <input
                    id="refundAmount"
                    type="number"
                    min="0"
                    max={totalAvailable}
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Maximum: {formatCurrency(totalAvailable, currency)}
                </p>
              </div>

              {parsedRefund > 0 && parsedRefund <= totalAvailable && (
                <div className="bg-secondary/10 rounded-xl p-4">
                  <p className="text-sm text-on-surface">
                    Withheld amount:{" "}
                    <span className="font-bold text-secondary">
                      {formatCurrency(withheld, currency)}
                    </span>
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Please itemize what the remaining{" "}
                    {formatCurrency(withheld, currency)} was used for in the next
                    step.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceedStep1()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {refundType === "full" ? "Skip to Review" : "Next"}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Deduction Itemization */}
      {step === 2 && (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary">
              receipt_long
            </span>
            <h2 className="font-headline font-bold text-xl text-primary">
              Deduction Itemization
            </h2>
          </div>

          <p className="text-sm text-on-surface-variant">
            Itemize the withheld amount of{" "}
            <span className="font-bold text-secondary">
              {formatCurrency(withheld, currency)}
            </span>
          </p>

          {/* Deduction rows */}
          <div className="space-y-4">
            {deductions.map((ded, idx) => (
              <div
                key={ded.id}
                className="bg-surface-container-low rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                    Deduction {idx + 1}
                  </p>
                  {deductions.length > 1 && (
                    <button
                      onClick={() => removeDeduction(ded.id)}
                      className="text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        close
                      </span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Category <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={ded.category}
                        onChange={(e) =>
                          updateDeduction(ded.id, "category", e.target.value)
                        }
                        className="w-full px-3 py-2.5 bg-surface-container-lowest rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                      >
                        <option value="">Select...</option>
                        {DEDUCTION_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Description <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={ded.description}
                      onChange={(e) =>
                        updateDeduction(ded.id, "description", e.target.value)
                      }
                      placeholder="e.g. Unpaid March rent"
                      className="w-full px-3 py-2.5 bg-surface-container-lowest rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Amount <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ded.amount}
                        onChange={(e) =>
                          updateDeduction(ded.id, "amount", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2.5 bg-surface-container-lowest rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* File upload */}
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-semibold cursor-pointer hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-sm">
                      upload_file
                    </span>
                    {ded.uploading
                      ? "Uploading..."
                      : ded.evidenceUrl
                        ? "Replace file"
                        : "Attach evidence"}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      disabled={ded.uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(ded.id, file);
                      }}
                    />
                  </label>
                  {ded.evidenceUrl && (
                    <span className="text-xs text-primary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        check_circle
                      </span>
                      File attached
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add deduction */}
          <button
            onClick={addDeduction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Deduction
          </button>

          {/* Running total */}
          <div
            className={`rounded-xl p-4 ${
              isBalanced
                ? "bg-primary/5"
                : "bg-error-container/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">
                  Total Deductions:{" "}
                  <span className={isBalanced ? "text-primary" : "text-error"}>
                    {formatCurrency(deductionTotal, currency)}
                  </span>
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isBalanced
                    ? "Deductions are balanced"
                    : remaining > 0
                      ? `Remaining to allocate: ${formatCurrency(remaining, currency)}`
                      : `Over-allocated by: ${formatCurrency(Math.abs(remaining), currency)}`}
                </p>
              </div>
              {isBalanced && (
                <span className="material-symbols-outlined text-primary">
                  check_circle
                </span>
              )}
            </div>
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceedStep2()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review & Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">
                fact_check
              </span>
              <h2 className="font-headline font-bold text-xl text-primary">
                Review & Confirm
              </h2>
            </div>

            {/* Property + tenant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-low rounded-2xl p-4">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Property
                </p>
                <p className="text-sm font-bold text-on-surface">
                  {propertyAddress}
                </p>
              </div>
              {tenant && (
                <div className="bg-surface-container-low rounded-2xl p-4">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                    Tenant
                  </p>
                  <p className="text-sm font-bold text-on-surface">
                    {tenant.first_name} {tenant.last_name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {tenant.email}
                  </p>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="bg-surface-container-low rounded-2xl p-4">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Refund Reason
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {reasonLabel}
              </p>
            </div>

            {/* Financial breakdown */}
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Financial Breakdown
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Original Deposit
                  </span>
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(deposit.amount, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Interest Accrued
                  </span>
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(deposit.interest_accrued ?? 0, currency)}
                  </span>
                </div>
                <div className="h-px bg-outline-variant/15" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Total Available
                  </span>
                  <span className="font-bold text-on-surface">
                    {formatCurrency(totalAvailable, currency)}
                  </span>
                </div>
                {finalDeductions > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">
                      Total Deductions
                    </span>
                    <span className="font-semibold text-error">
                      -{formatCurrency(finalDeductions, currency)}
                    </span>
                  </div>
                )}
                <div className="h-px bg-outline-variant/15" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    Refund Amount
                  </span>
                  <span className="text-lg font-extrabold text-primary">
                    {formatCurrency(finalRefund, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Deduction details */}
            {refundType === "partial" && deductions.length > 0 && (
              <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                  Deduction Details
                </p>
                {deductions.map((d, idx) => (
                  <div
                    key={d.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">
                        {idx + 1}.{" "}
                        {DEDUCTION_CATEGORIES.find(
                          (c) => c.value === d.category
                        )?.label ?? d.category}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {d.description}
                      </p>
                      {d.evidenceUrl && (
                        <p className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-xs">
                            attach_file
                          </span>
                          Evidence attached
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-on-surface flex-shrink-0">
                      {formatCurrency(parseFloat(d.amount) || 0, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Return method */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">
                send_money
              </span>
              <h2 className="font-headline font-bold text-xl text-primary">
                Refund Method
              </h2>
            </div>

            <div className="space-y-3">
              {/* E-transfer */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  returnMethod === "etransfer"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  type="radio"
                  name="returnMethod"
                  value="etransfer"
                  checked={returnMethod === "etransfer"}
                  onChange={(e) => {
                    setReturnMethod(e.target.value);
                    setReturnReference("");
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    returnMethod === "etransfer"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {returnMethod === "etransfer" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">
                    E-Transfer
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Send via Interac e-Transfer
                  </p>
                </div>
              </label>

              {returnMethod === "etransfer" && (
                <div className="ml-8">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={returnReference}
                    onChange={(e) => setReturnReference(e.target.value)}
                    placeholder={tenant?.email || "tenant@email.com"}
                    className="w-full max-w-sm px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              )}

              {/* Cheque */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  returnMethod === "cheque"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  type="radio"
                  name="returnMethod"
                  value="cheque"
                  checked={returnMethod === "cheque"}
                  onChange={(e) => {
                    setReturnMethod(e.target.value);
                    setReturnReference("");
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    returnMethod === "cheque"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {returnMethod === "cheque" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">Cheque</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Mail a cheque to the tenant
                  </p>
                </div>
              </label>

              {returnMethod === "cheque" && (
                <div className="ml-8">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Mailing Address
                  </label>
                  <input
                    type="text"
                    value={returnReference}
                    onChange={(e) => setReturnReference(e.target.value)}
                    placeholder="Tenant's mailing address"
                    className="w-full max-w-sm px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              )}

              {/* Direct deposit */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  returnMethod === "direct_deposit"
                    ? "bg-primary-fixed/15 ring-2 ring-primary/30"
                    : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                <input
                  type="radio"
                  name="returnMethod"
                  value="direct_deposit"
                  checked={returnMethod === "direct_deposit"}
                  onChange={(e) => {
                    setReturnMethod(e.target.value);
                    setReturnReference("");
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    returnMethod === "direct_deposit"
                      ? "bg-primary"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {returnMethod === "direct_deposit" && (
                    <span className="material-symbols-outlined text-on-primary text-xs">
                      check
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">
                    Direct Deposit
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Transfer directly to the tenant&apos;s bank account
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Confirmation */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md bg-surface-container-highest flex items-center justify-center flex-shrink-0 mt-0.5 peer-checked:bg-primary transition-colors">
                {confirmed && (
                  <span className="material-symbols-outlined text-on-primary text-xs">
                    check
                  </span>
                )}
              </div>
              <span className="text-sm text-on-surface leading-relaxed">
                I confirm this deposit return statement is accurate and
                authorize the refund of{" "}
                <span className="font-bold text-primary">
                  {formatCurrency(finalRefund, currency)}
                </span>{" "}
                to the tenant. A notification and email will be sent to the
                tenant.
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_back
                </span>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!confirmed || submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      send
                    </span>
                    Send Deposit Return Statement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
