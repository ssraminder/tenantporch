"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const ID_TYPES = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "provincial_id", label: "Provincial ID" },
  { value: "pr_card", label: "PR Card" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: "bg-surface-variant", text: "text-on-surface-variant", label: "Not Submitted" },
  pending: { bg: "bg-secondary-fixed/30", text: "text-on-secondary-fixed-variant", label: "Pending Review" },
  approved: { bg: "bg-tertiary-fixed/30", text: "text-on-tertiary-fixed-variant", label: "Approved" },
  rejected: { bg: "bg-error-container", text: "text-on-error-container", label: "Rejected" },
};

interface IdVerificationFormProps {
  tenantId: string;
  /** "admin" = landlord managing tenant's ID; "tenant" = self-upload */
  mode: "admin" | "tenant";
  currentData?: {
    id_type?: string | null;
    id_number?: string | null;
    id_place_of_issue?: string | null;
    id_expiry_date?: string | null;
    id_name_on_document?: string | null;
    id_document_url?: string | null;
    id_document_status?: string | null;
    id_uploaded_at?: string | null;
    id_reviewed_at?: string | null;
  } | null;
  stripeVerification?: {
    status: string | null;
    verificationUrl: string | null;
    expiresAt: string | null;
  } | null;
  planVerificationInfo?: {
    freePerMonth: number;
    usedThisMonth: number;
  } | null;
}

export function IdVerificationForm({
  tenantId,
  mode,
  currentData,
  stripeVerification,
  planVerificationInfo,
}: IdVerificationFormProps) {
  const [idType, setIdType] = useState(currentData?.id_type ?? "");
  const [idNumber, setIdNumber] = useState(currentData?.id_number ?? "");
  const [idPlaceOfIssue, setIdPlaceOfIssue] = useState(currentData?.id_place_of_issue ?? "");
  const [idExpiryDate, setIdExpiryDate] = useState(currentData?.id_expiry_date ?? "");
  const [idNameOnDocument, setIdNameOnDocument] = useState(currentData?.id_name_on_document ?? "");
  const [documentUrl, setDocumentUrl] = useState(currentData?.id_document_url ?? "");
  const [status, setStatus] = useState(currentData?.id_document_status ?? "none");
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.none;
  const isEditable = mode === "admin" || status !== "approved";

  const stripeStatus = stripeVerification?.status ?? null;
  const verificationUrl = stripeVerification?.verificationUrl ?? null;
  const isExpired =
    stripeVerification?.expiresAt &&
    new Date(stripeVerification.expiresAt) < new Date();
  const hasActiveStripeVerification =
    stripeStatus === "pending" && verificationUrl && !isExpired;

  const freeRemaining = planVerificationInfo
    ? planVerificationInfo.freePerMonth - planVerificationInfo.usedThisMonth
    : 0;

  async function handleCopyUrl() {
    if (!verificationUrl) return;
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handlePurchaseVerification() {
    setPurchasing(true);
    try {
      const res = await fetch("/api/stripe/identity/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to purchase verification");
      }
      const data = await res.json();
      if (data.free && data.success) {
        toast.success("Verification sent to tenant (free with your plan)");
        window.location.reload();
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to purchase verification");
    } finally {
      setPurchasing(false);
    }
  }

  async function handleSaveInfo() {
    if (!idType || !idNumber || !idNameOnDocument) {
      toast.error("ID Type, Number, and Name on Document are required.");
      return;
    }
    setSavingInfo(true);
    try {
      const formData = new FormData();
      formData.append("id_type", idType);
      formData.append("id_number", idNumber);
      formData.append("id_place_of_issue", idPlaceOfIssue);
      formData.append("id_expiry_date", idExpiryDate);
      formData.append("id_name_on_document", idNameOnDocument);

      let result;
      if (mode === "admin") {
        formData.append("tenant_id", tenantId);
        const { saveTenantIdInfo } = await import("@/app/admin/actions/tenant-actions");
        result = await saveTenantIdInfo(formData);
      } else {
        const { saveMyIdInfo } = await import("@/app/tenant/actions/profile-actions");
        result = await saveMyIdInfo(formData);
      }

      if (result.success) {
        toast.success("ID information saved.");
        setStatus("pending");
      } else {
        toast.error(result.error ?? "Failed to save ID information.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      let result;
      if (mode === "admin") {
        formData.append("tenant_id", tenantId);
        const { uploadTenantId } = await import("@/app/admin/actions/tenant-actions");
        result = await uploadTenantId(formData);
      } else {
        const { uploadMyId } = await import("@/app/tenant/actions/profile-actions");
        result = await uploadMyId(formData);
      }

      if (result.success && result.url) {
        toast.success("ID document uploaded.");
        setDocumentUrl(result.url);
        setStatus("pending");
      } else {
        toast.error(result.error ?? "Failed to upload document.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleReview(action: "approved" | "rejected") {
    setReviewing(true);
    try {
      const { reviewTenantId } = await import("@/app/admin/actions/tenant-actions");
      const result = await reviewTenantId(tenantId, action);
      if (result.success) {
        toast.success(action === "approved" ? "ID approved." : "ID rejected.");
        setStatus(action);
      } else {
        toast.error(result.error ?? "Failed to review ID.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setReviewing(false);
    }
  }

  // ── Stripe Verification URL / QR Code Display ──
  function renderStripeVerificationBanner() {
    if (stripeStatus === "verified") {
      return (
        <div className="mb-6 flex items-center gap-3 p-5 bg-tertiary-fixed/20 rounded-2xl">
          <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-xl">verified</span>
          <div>
            <p className="text-sm font-bold text-on-tertiary-fixed-variant">Verified via Stripe Identity</p>
            <p className="text-xs text-on-tertiary-fixed-variant/80">
              Identity was automatically verified with document + selfie match.
            </p>
          </div>
        </div>
      );
    }

    if (stripeStatus === "failed") {
      return (
        <div className="mb-6 flex items-center gap-3 p-5 bg-error-container/30 rounded-2xl">
          <span className="material-symbols-outlined text-on-error-container text-xl">error</span>
          <div>
            <p className="text-sm font-bold text-on-error-container">Stripe Verification Failed</p>
            <p className="text-xs text-on-error-container/80">
              {mode === "tenant"
                ? "The automated verification could not be completed. You can use the manual form below instead."
                : "The automated verification failed. You can request a new one or use manual verification."}
            </p>
          </div>
        </div>
      );
    }

    if (stripeStatus === "pending" && verificationUrl) {
      if (isExpired) {
        return (
          <div className="mb-6 flex items-center gap-3 p-5 bg-surface-variant rounded-2xl">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">schedule</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Verification Link Expired</p>
              <p className="text-xs text-on-surface-variant">
                {mode === "tenant"
                  ? "The verification link has expired. Please contact your landlord to request a new one."
                  : "The verification link has expired. You can send a new one."}
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="mb-6 p-5 bg-primary-fixed/10 border border-primary/15 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
            <div>
              <p className="text-sm font-bold text-on-surface">
                {mode === "tenant"
                  ? "Your landlord has requested identity verification"
                  : "Stripe Identity verification sent"}
              </p>
              <p className="text-xs text-on-surface-variant">
                {mode === "tenant"
                  ? "Complete the verification using your phone camera. It takes under 2 minutes."
                  : "Waiting for the tenant to complete verification."}
              </p>
            </div>
          </div>

          {/* QR Code (desktop) */}
          <div className="hidden md:flex flex-col items-center gap-3 py-4">
            <div className="bg-white p-4 rounded-2xl shadow-ambient-sm">
              <QRCodeSVG value={verificationUrl} size={180} />
            </div>
            <p className="text-xs text-on-surface-variant text-center">
              {mode === "tenant"
                ? "Scan this QR code with your phone to verify"
                : "Share this QR code with your tenant"}
            </p>
          </div>

          {/* Mobile button (tenant only) */}
          {mode === "tenant" && (
            <a
              href={verificationUrl}
              className="md:hidden w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">shield</span>
              Complete Verification
            </a>
          )}

          {/* Copy URL */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-surface-container-low rounded-xl overflow-hidden">
              <span className="material-symbols-outlined text-on-surface-variant text-sm flex-shrink-0">link</span>
              <span className="text-xs text-on-surface-variant truncate">{verificationUrl}</span>
            </div>
            <button
              onClick={handleCopyUrl}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {stripeVerification?.expiresAt && (
            <p className="text-xs text-on-surface-variant text-center">
              Link expires {new Date(stripeVerification.expiresAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      );
    }

    return null;
  }

  // ── Admin Verification Method Modal ──
  function renderMethodModal() {
    if (!showMethodModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setShowMethodModal(false)} />
        <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
            <h2 className="font-headline text-lg font-bold text-primary">Choose Verification Method</h2>
            <button
              onClick={() => setShowMethodModal(false)}
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Free Option */}
            <div className="border border-outline-variant/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-on-surface-variant">edit_document</span>
                  <h3 className="font-bold text-on-surface">Manual Review</h3>
                </div>
                <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-full">Free</span>
              </div>
              <p className="text-sm text-on-surface-variant">
                Enter tenant&apos;s ID information and upload a photo. You review and approve or reject manually.
              </p>
              <div className="space-y-2 pt-1">
                {[
                  "Enter ID details manually",
                  "Upload a photo of the document",
                  "You approve or reject the submission",
                  "Tenant can also self-submit from their profile",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant/60 text-sm mt-0.5">check</span>
                    <span className="text-xs text-on-surface-variant">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowMethodModal(false)}
                className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Use Manual Review
              </button>
            </div>

            {/* Premium Option */}
            <div className="relative border-2 border-primary/30 rounded-2xl p-5 space-y-3 bg-primary/[0.02]">
              {/* Recommended badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">star</span>
                  Recommended
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  <h3 className="font-bold text-primary">Stripe Identity</h3>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {freeRemaining > 0
                    ? `Free (${freeRemaining} left this month)`
                    : "$3.99"}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant">
                Auto-verified via phone camera with document scan and selfie match. No manual review needed.
              </p>
              <div className="space-y-2 pt-1">
                {[
                  "Tenant verifies on their phone in under 2 minutes",
                  "Automatic document scan + live selfie match",
                  "Instant approval — no manual review required",
                  "Fraud detection powered by Stripe",
                  "Verification link sent to tenant automatically",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm mt-0.5">check_circle</span>
                    <span className="text-xs text-on-surface">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowMethodModal(false);
                  handlePurchaseVerification();
                }}
                disabled={purchasing}
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Processing...
                  </>
                ) : freeRemaining > 0 ? (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    Send Verification to Tenant
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">shopping_cart</span>
                    Purchase &amp; Send — $3.99
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine if we should hide the manual form
  const hideManualForm =
    mode === "tenant" &&
    (hasActiveStripeVerification || stripeStatus === "verified");

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">badge</span>
          <h2 className="font-headline font-bold text-xl">ID Verification</h2>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Stripe Verification Banner (both modes) */}
      {renderStripeVerificationBanner()}

      {/* Admin: Verification Method Chooser */}
      {mode === "admin" && status !== "approved" && !hasActiveStripeVerification && stripeStatus !== "verified" && (
        <div className="mb-6">
          <button
            onClick={() => setShowMethodModal(true)}
            disabled={purchasing}
            className="w-full flex items-center justify-between gap-3 p-4 border border-primary/20 rounded-2xl hover:bg-primary/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface">
                  Want faster, automated verification?
                </p>
                <p className="text-xs text-on-surface-variant">
                  {freeRemaining > 0
                    ? `Use Stripe Identity — ${freeRemaining} free verification${freeRemaining === 1 ? "" : "s"} remaining this month`
                    : "Use Stripe Identity — $3.99 per verification"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">star</span>
                Recommended
              </span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Admin: Re-send button for expired verification */}
      {mode === "admin" && stripeStatus === "pending" && isExpired && (
        <div className="mb-6">
          <button
            onClick={handlePurchaseVerification}
            disabled={purchasing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {purchasing ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">refresh</span>
                Re-send Verification {freeRemaining > 0 ? "(Free)" : "— $3.99"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Method Modal */}
      {renderMethodModal()}

      {/* Manual ID Form (hidden when Stripe verification is active/verified for tenant) */}
      {!hideManualForm && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID Type */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                ID Type <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  badge
                </span>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  disabled={!isEditable}
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Select ID type</option>
                  {ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                ID Number <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  pin
                </span>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  disabled={!isEditable}
                  placeholder="Document number"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Name on Document */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Name on Document <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  person
                </span>
                <input
                  type="text"
                  value={idNameOnDocument}
                  onChange={(e) => setIdNameOnDocument(e.target.value)}
                  disabled={!isEditable}
                  placeholder="Full name as printed on ID"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Place of Issue */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Place of Issue
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  location_on
                </span>
                <input
                  type="text"
                  value={idPlaceOfIssue}
                  onChange={(e) => setIdPlaceOfIssue(e.target.value)}
                  disabled={!isEditable}
                  placeholder="Province / Country (optional)"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-bold text-primary mb-2">
                Expiry Date
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  event
                </span>
                <input
                  type="date"
                  value={idExpiryDate}
                  onChange={(e) => setIdExpiryDate(e.target.value)}
                  disabled={!isEditable}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Save Info Button */}
          {isEditable && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveInfo}
                disabled={savingInfo}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingInfo ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Save ID Info
                  </>
                )}
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">
              ID Document Photo
            </label>

            {documentUrl ? (
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-primary-fixed-variant">image</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">Document uploaded</p>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-secondary hover:underline"
                  >
                    View document
                  </a>
                </div>
                {isEditable && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-xs font-bold text-secondary hover:underline"
                  >
                    Replace
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || !isEditable}
                className="w-full p-6 border-2 border-dashed border-outline-variant/30 rounded-xl text-center hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-outline-variant animate-spin">progress_activity</span>
                    <p className="text-sm text-on-surface-variant">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-outline-variant">cloud_upload</span>
                    <p className="text-sm font-semibold text-on-surface-variant">
                      Click to upload ID photo
                    </p>
                    <p className="text-xs text-on-surface-variant/70">
                      JPEG, PNG, WebP, or PDF — max 10MB
                    </p>
                  </div>
                )}
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Admin Review Buttons */}
          {mode === "admin" && status === "pending" && (
            <>
              <div className="h-px bg-outline-variant/15" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-on-surface-variant">
                  Review this tenant&apos;s identification document.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReview("rejected")}
                    disabled={reviewing}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-error/30 text-error text-sm font-bold hover:bg-error-container/30 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview("approved")}
                    disabled={reviewing}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Approve
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Info banners for tenant */}
          {mode === "tenant" && status === "pending" && !hasActiveStripeVerification && (
            <div className="flex items-center gap-3 p-4 bg-secondary-fixed/20 rounded-xl">
              <span className="material-symbols-outlined text-on-secondary-fixed-variant">hourglass_top</span>
              <p className="text-sm text-on-secondary-fixed-variant">
                Your ID is pending review by your landlord. You&apos;ll be notified once it&apos;s approved.
              </p>
            </div>
          )}

          {mode === "tenant" && status === "approved" && (
            <div className="flex items-center gap-3 p-4 bg-tertiary-fixed/20 rounded-xl">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant">verified</span>
              <p className="text-sm text-on-tertiary-fixed-variant">
                Your identification has been verified.
              </p>
            </div>
          )}

          {mode === "tenant" && status === "rejected" && stripeStatus !== "failed" && (
            <div className="flex items-center gap-3 p-4 bg-error-container/30 rounded-xl">
              <span className="material-symbols-outlined text-on-error-container">error</span>
              <p className="text-sm text-on-error-container">
                Your ID was not accepted. Please upload a clearer photo or a different document.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
