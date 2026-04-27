"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeaseDocumentContent, LeaseSection, LeaseClause } from "@/lib/lease-templates/alberta";
import { SigningEmailPreviewModal, type SigningRecipient } from "./signing-email-preview-modal";

export interface EmailLogEntry {
  id: string;
  signing_request_id: string;
  lease_document_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  email_type: string;
  status: string;
  sent_at: string;
  participant_id: string | null;
  resend_message_id: string | null;
  subject?: string | null;
}

interface LeaseDocumentEditorProps {
  leaseId: string;
  propertyId: string;
  documentContent: LeaseDocumentContent | null;
  signingStatus: string;
  isReadOnly: boolean;
  propertyAddress: string;
  tenantCount: number;
  hasUnverifiedTenants: boolean;
  tenantDataStale?: boolean;
  recipients?: SigningRecipient[];
  emailLogs?: EmailLogEntry[];
  signedDocumentUrl?: string | null;
  /** When editing a specific rp_lease_documents row */
  documentId?: string;
  /** Custom title for the document (e.g. "Schedule A — Property Details") */
  documentTitle?: string;
  /** URL to navigate back to (document dashboard) */
  parentUrl?: string;
  /** True if the current user is a TenantPorch platform admin (gates destructive actions) */
  isPlatformAdmin?: boolean;
  /** Lifecycle status of the lease ('draft' | 'active' | 'expired' | 'terminated' | 'completed'). */
  leaseStatus?: string;
}

export function LeaseDocumentEditor({
  leaseId,
  propertyId,
  documentContent,
  signingStatus,
  isReadOnly,
  propertyAddress,
  tenantCount,
  hasUnverifiedTenants,
  tenantDataStale = false,
  recipients = [],
  emailLogs = [],
  signedDocumentUrl,
  documentId,
  documentTitle,
  parentUrl,
  isPlatformAdmin = false,
  leaseStatus,
}: LeaseDocumentEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<LeaseDocumentContent | null>(documentContent);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [additionalTermText, setAdditionalTermText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [sendingForSign, setSendingForSign] = useState(false);
  const [cancellingSigning, setCancellingSigning] = useState(false);
  const [showSigningPreview, setShowSigningPreview] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showIdOverrideDialog, setShowIdOverrideDialog] = useState(false);
  const [idOverrideAcknowledged, setIdOverrideAcknowledged] = useState(false);
  const [showSignedOfflineModal, setShowSignedOfflineModal] = useState(false);
  const [markingOffline, setMarkingOffline] = useState(false);
  const offlineFileRef = useRef<HTMLInputElement>(null);
  const [resettingSignatures, setResettingSignatures] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [terminatingLease, setTerminatingLease] = useState(false);
  const [deletingLease, setDeletingLease] = useState(false);
  const [savingAsTemplate, setSavingAsTemplate] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [generatingManualLinks, setGeneratingManualLinks] = useState(false);
  const [manualSigningLinks, setManualSigningLinks] = useState<
    | {
        id: string;
        name: string;
        email: string;
        role: string;
        url: string;
      }[]
    | null
  >(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  function updateClause(sectionId: string, clauseId: string, newText: string) {
    if (!content) return;
    setContent({
      ...content,
      sections: content.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              clauses: s.clauses.map((c) =>
                c.id === clauseId ? { ...c, text: newText } : c
              ),
            }
          : s
      ),
    });
  }

  function addAdditionalTerm() {
    if (!content || !additionalTermText.trim()) return;
    const newTerm: LeaseClause = {
      id: `additional-${Date.now()}`,
      text: additionalTermText.trim(),
      editable: true,
    };
    setContent({
      ...content,
      additionalTerms: [...content.additionalTerms, newTerm],
    });
    setAdditionalTermText("");
  }

  function removeAdditionalTerm(clauseId: string) {
    if (!content) return;
    setContent({
      ...content,
      additionalTerms: content.additionalTerms.filter((c) => c.id !== clauseId),
    });
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    try {
      if (documentId) {
        // Save to the specific rp_lease_documents row (+ dual-write)
        const { saveLeaseDocumentById } = await import("@/app/admin/actions/lease-actions");
        const result = await saveLeaseDocumentById(documentId, content);
        if (result.success) {
          toast.success("Document saved.");
        } else {
          toast.error(result.error ?? "Failed to save.");
        }
      } else {
        // Legacy: save to rp_leases.lease_document_content
        const { saveLeaseDocument } = await import("@/app/admin/actions/lease-actions");
        const result = await saveLeaseDocument(leaseId, content);
        if (result.success) {
          toast.success("Document saved.");
        } else {
          toast.error(result.error ?? "Failed to save.");
        }
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadPDF() {
    // If signed PDF exists, open it directly
    if (signingStatus === "completed" && signedDocumentUrl) {
      window.open(signedDocumentUrl, "_blank");
      return;
    }

    if (!content) return;
    setDownloading(true);
    try {
      const { downloadLeasePDF } = await import("@/lib/pdf/generate-lease-pdf");
      await downloadLeasePDF(content, propertyAddress, signingStatus !== "completed");
      toast.success("PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { uploadLeaseDocument } = await import("@/app/admin/actions/lease-actions");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lease_id", leaseId);
      const result = await uploadLeaseDocument(formData);
      if (result.success) {
        toast.success("Document uploaded. This replaces the generated template.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to upload.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSendClick() {
    if (hasUnverifiedTenants && !idOverrideAcknowledged) {
      setShowIdOverrideDialog(true);
    } else {
      setShowSigningPreview(true);
    }
  }

  function handleIdOverrideConfirm() {
    setIdOverrideAcknowledged(true);
    setShowIdOverrideDialog(false);
    setShowSigningPreview(true);
  }

  async function handleSendForSignatures() {
    setSendingForSign(true);
    try {
      // Per-document signing: each document (Lease Agreement, Schedule A,
      // Schedule B, addendums, custom) has its own signing flow.
      if (documentId) {
        const { sendDocumentForSignatures } = await import(
          "@/app/admin/actions/document-signing-actions"
        );
        const result = await sendDocumentForSignatures(documentId, {
          overrideIdCheck: idOverrideAcknowledged,
        });
        if (result.success) {
          toast.success(
            "Document sent for signatures. Tenants will be notified first; the landlord receives a signing link after all tenants finish."
          );
          router.refresh();
        } else {
          toast.error(result.error ?? "Failed to send for signatures.");
        }
        return;
      }

      const { sendForSignatures } = await import("@/app/admin/actions/signing-actions");
      const result = await sendForSignatures(leaseId, {
        overrideIdCheck: idOverrideAcknowledged,
      });
      if (result.success) {
        toast.success("Lease sent for signatures. All parties have been notified.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to send for signatures.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSendingForSign(false);
    }
  }

  async function handleGenerateManualLinks() {
    setGeneratingManualLinks(true);
    try {
      // Per-document path doesn't expose manual-link generation yet; fall
      // back to the lease-wide flow so the landlord can copy URLs out of band.
      const { sendForSignatures } = await import("@/app/admin/actions/signing-actions");
      const result = await sendForSignatures(leaseId, {
        overrideIdCheck: idOverrideAcknowledged || hasUnverifiedTenants,
        skipEmail: true,
      });
      if (result.success && result.participants) {
        setManualSigningLinks(result.participants);
        toast.success("Signing links generated. Share them with each signer.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to generate signing links.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setGeneratingManualLinks(false);
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTokenId(id);
      setTimeout(() => setCopiedTokenId((current) => (current === id ? null : current)), 1800);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handleTerminateLease() {
    if (
      !confirm(
        "Terminate this lease? It will be marked as terminated with today's end date. This cannot be undone."
      )
    ) {
      return;
    }
    setTerminatingLease(true);
    try {
      const { terminateLease } = await import(
        "@/app/admin/actions/lease-actions"
      );
      const result = await terminateLease(leaseId);
      if (result.success) {
        toast.success("Lease terminated.");
        router.push(`/admin/properties/${propertyId}`);
      } else {
        toast.error(result.error ?? "Failed to terminate lease.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setTerminatingLease(false);
    }
  }

  async function handleDeleteLease() {
    if (
      !confirm(
        "Delete this draft lease? All draft documents on it will be removed. This cannot be undone."
      )
    ) {
      return;
    }
    setDeletingLease(true);
    try {
      const { deleteLease } = await import(
        "@/app/admin/actions/lease-actions"
      );
      const result = await deleteLease(leaseId);
      if (result.success) {
        toast.success("Draft lease deleted.");
        router.push(`/admin/properties/${propertyId}`);
      } else {
        toast.error(result.error ?? "Failed to delete lease.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeletingLease(false);
    }
  }

  async function handleSaveAsTemplate() {
    if (!templateName.trim()) {
      toast.error("Template name is required.");
      return;
    }
    setSavingAsTemplate(true);
    try {
      const { saveLeaseAsTemplate } = await import(
        "@/app/admin/actions/lease-template-actions"
      );
      const result = await saveLeaseAsTemplate(leaseId, {
        name: templateName.trim(),
        description: templateDescription.trim() || null,
      });
      if (result.success) {
        toast.success("Saved as a reusable template.");
        setShowSaveAsTemplate(false);
        setTemplateName("");
        setTemplateDescription("");
      } else {
        toast.error(result.error ?? "Failed to save template.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSavingAsTemplate(false);
    }
  }

  async function handleResetSignatures() {
    setResettingSignatures(true);
    try {
      const { resetLeaseSignatures } = await import(
        "@/app/admin/actions/signing-actions"
      );
      const result = await resetLeaseSignatures(leaseId, {
        wipeSignedPdfs: true,
      });
      if (result.success) {
        const cancelled = (result as { cancelledRequests?: number })
          .cancelledRequests ?? 0;
        const removed = (result as { removedDocuments?: number })
          .removedDocuments ?? 0;
        toast.success(
          `Signatures reset. ${cancelled} request${cancelled === 1 ? "" : "s"} cancelled${
            removed > 0
              ? `, ${removed} signed PDF${removed === 1 ? "" : "s"} removed`
              : ""
          }.`
        );
        setShowResetConfirm(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reset signatures.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setResettingSignatures(false);
    }
  }

  async function handleCancelSigning() {
    setCancellingSigning(true);
    try {
      const { cancelSigning } = await import("@/app/admin/actions/signing-actions");
      const result = await cancelSigning(leaseId);
      if (result.success) {
        toast.success("Signing cancelled. Lease is back in draft mode.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to cancel signing.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setCancellingSigning(false);
    }
  }

  async function handleRegenerateDocument() {
    setRegenerating(true);
    try {
      const { regenerateLeaseDocument } = await import("@/app/admin/actions/lease-actions");
      const result = await regenerateLeaseDocument(leaseId);
      if (result.success) {
        if (result.content) {
          setContent(result.content);
        }
        toast.success("Document regenerated with latest data.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to regenerate.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleMarkSignedOffline() {
    setMarkingOffline(true);
    try {
      const { markLeaseSignedOffline } = await import(
        "@/app/admin/actions/signing-actions"
      );
      const file = offlineFileRef.current?.files?.[0];
      let formData: FormData | undefined;
      if (file) {
        formData = new FormData();
        formData.append("file", file);
      }
      const result = await markLeaseSignedOffline(leaseId, formData);
      if (result.success) {
        toast.success("Lease marked as signed. Lease is now active.");
        setShowSignedOfflineModal(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to mark as signed.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setMarkingOffline(false);
      if (offlineFileRef.current) offlineFileRef.current.value = "";
    }
  }

  if (!content) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient-sm text-center">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
          description
        </span>
        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          No Document Generated
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          This lease does not have a document yet. The document is generated automatically when you create a lease with tenants assigned.
        </p>
        <button
          onClick={() => router.push(`/admin/properties/${propertyId}`)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Property
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Dashboard */}
      {parentUrl && (
        <button
          onClick={() => router.push(parentUrl)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Documents
        </button>
      )}

      {/* Status Bar */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">description</span>
            <div>
              <h1 className="font-headline font-extrabold text-xl text-primary">
                {documentTitle ?? "Lease Agreement"}
              </h1>
              <p className="text-sm text-on-surface-variant">
                {propertyAddress} &middot; {tenantCount} tenant{tenantCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SigningStatusBadge status={signingStatus} />
          </div>
        </div>

        {/* Warning banners */}
        {tenantDataStale && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
            <span className="material-symbols-outlined text-amber-600">sync_problem</span>
            <p className="text-sm text-amber-800">
              Tenant information in the document is outdated. Click <strong>Regenerate</strong> to update with current tenant data.
            </p>
          </div>
        )}
        {hasUnverifiedTenants && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
            <span className="material-symbols-outlined text-amber-600">shield_person</span>
            <p className="text-sm text-amber-800">
              One or more tenants have unverified IDs. You can still send for signatures, but you&apos;ll need to verify their identity in person before handing over the keys.
            </p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {!isReadOnly && (
        <div className="sticky top-0 z-30 bg-surface-container-lowest rounded-2xl p-4 shadow-ambient-sm flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {saving ? "progress_activity" : "save"}
            </span>
            {saving ? "Saving..." : "Save Draft"}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {downloading ? "progress_activity" : "picture_as_pdf"}
            </span>
            {downloading ? "Generating..." : "Download Draft PDF"}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print
          </button>

          <div className="h-8 w-px bg-outline-variant/20 hidden sm:block" />

          <button
            onClick={handleRegenerateDocument}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {regenerating ? "progress_activity" : "autorenew"}
            </span>
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            {uploading ? "Uploading..." : "Upload Own Document"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={handleUploadDocument}
            className="hidden"
          />

          {!documentId && (
            <button
              type="button"
              onClick={() => {
                setTemplateName("");
                setTemplateDescription("");
                setShowSaveAsTemplate(true);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors"
              title="Snapshot the current lease's documents into a reusable template"
            >
              <span className="material-symbols-outlined text-sm">bookmark_add</span>
              Save as Template
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={() => setShowSignedOfflineModal(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors"
            title="Mark this lease as signed offline (paper signing)"
          >
            <span className="material-symbols-outlined text-sm">draw</span>
            Signed Offline
          </button>

          <button
            onClick={handleGenerateManualLinks}
            disabled={generatingManualLinks || sendingForSign}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Create signing links without sending email — copy and share them manually"
          >
            <span className="material-symbols-outlined text-sm">
              {generatingManualLinks ? "progress_activity" : "link"}
            </span>
            {generatingManualLinks ? "Generating..." : "Generate Signing Links (Manual)"}
          </button>

          <button
            onClick={handleSendClick}
            disabled={sendingForSign}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send to all parties for electronic signature"
          >
            <span className="material-symbols-outlined text-sm">
              {sendingForSign ? "progress_activity" : "send"}
            </span>
            {sendingForSign ? "Sending..." : "Send for Signatures"}
          </button>
        </div>
      )}

      {/* Manual Signing Links Modal */}
      {manualSigningLinks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => setManualSigningLinks(null)}
          />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 pt-6 pb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-xl">link</span>
                </div>
                <div>
                  <h2 className="font-headline text-lg font-extrabold text-primary">
                    Manual Signing Links
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    Email was not sent. Copy and share each link with the matching signer.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-3">
              {manualSigningLinks.map((p) => (
                <div
                  key={p.id}
                  className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="font-bold text-on-surface">{p.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {p.email} · {p.role}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(p.url, p.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedTokenId === p.id ? "check" : "content_copy"}
                      </span>
                      {copiedTokenId === p.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs font-mono break-all text-on-surface-variant bg-surface-container rounded-lg px-3 py-2">
                    {p.url}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low flex justify-end">
              <button
                onClick={() => setManualSigningLinks(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signing Email Preview Modal */}
      <SigningEmailPreviewModal
        open={showSigningPreview}
        onClose={() => setShowSigningPreview(false)}
        onConfirm={async () => {
          setShowSigningPreview(false);
          await handleSendForSignatures();
        }}
        sending={sendingForSign}
        recipients={recipients}
        propertyAddress={propertyAddress}
      />

      {/* ID Verification Override Dialog */}
      {showIdOverrideDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => setShowIdOverrideDialog(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            {/* Content */}
            <div className="px-6 pt-6 pb-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-xl">
                    shield_person
                  </span>
                </div>
                <h2 className="font-headline text-lg font-extrabold text-primary">
                  Unverified Tenant IDs
                </h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                One or more tenants on this lease have not completed ID verification
                through the app. By proceeding, you acknowledge that:
              </p>
              <ul className="text-sm text-on-surface space-y-2">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-0.5 text-amber-600">
                    check_circle
                  </span>
                  You will verify each tenant&apos;s identity in person before
                  handing over the keys
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-0.5 text-amber-600">
                    check_circle
                  </span>
                  You accept responsibility for confirming their identity
                </li>
              </ul>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <button
                onClick={() => setShowIdOverrideDialog(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleIdOverrideConfirm}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-sm">
                  verified_user
                </span>
                I&apos;ll Verify In Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signed Offline Modal */}
      {showSignedOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => setShowSignedOfflineModal(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-xl">
                    draw
                  </span>
                </div>
                <div>
                  <h2 className="font-headline text-lg font-extrabold text-primary">
                    Mark Lease as Signed Offline
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    {propertyAddress}
                  </p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Mark this lease as signed outside the platform (e.g., paper signing).
                The lease will become <strong>active</strong> immediately.
                You can optionally upload a scanned copy of the signed document.
              </p>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">
                  Upload Signed PDF (optional)
                </label>
                <input
                  ref={offlineFileRef}
                  type="file"
                  accept="application/pdf"
                  className="w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-surface-container-high file:text-on-surface hover:file:bg-surface-container-highest"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <button
                onClick={() => {
                  setShowSignedOfflineModal(false);
                  if (offlineFileRef.current) offlineFileRef.current.value = "";
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkSignedOffline}
                disabled={markingOffline}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  {markingOffline ? "progress_activity" : "check_circle"}
                </span>
                {markingOffline ? "Marking..." : "Mark as Signed & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-only action bar (when sent/partially signed) */}
      {isReadOnly && signingStatus !== "completed" && (
        <div className="sticky top-0 z-30 bg-surface-container-lowest rounded-2xl p-4 shadow-ambient-sm flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {downloading ? "progress_activity" : "picture_as_pdf"}
            </span>
            Download PDF
          </button>

          <div className="flex-1" />

          <button
            onClick={handleCancelSigning}
            disabled={cancellingSigning}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-error/30 text-error text-sm font-bold hover:bg-error-container/20 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {cancellingSigning ? "progress_activity" : "cancel"}
            </span>
            {cancellingSigning ? "Cancelling..." : "Cancel Signing"}
          </button>

          {isPlatformAdmin && (
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resettingSignatures}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-error/30 text-error text-sm font-bold hover:bg-error-container/20 transition-colors disabled:opacity-50"
              title="Platform-admin only: discard all collected signatures and put the lease back in draft."
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset Signatures
            </button>
          )}
        </div>
      )}

      {/* Completed action bar */}
      {signingStatus === "completed" && (
        <div className="bg-tertiary-fixed/10 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
          <span className="material-symbols-outlined text-2xl text-on-tertiary-fixed-variant">
            verified
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-on-tertiary-fixed-variant">
              Lease Fully Signed
            </p>
            <p className="text-sm text-on-surface-variant">
              All parties have signed this lease agreement.
            </p>
          </div>
          {signedDocumentUrl && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Download Signed PDF
            </button>
          )}
          {isPlatformAdmin && (
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resettingSignatures}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-error/30 text-error text-sm font-bold hover:bg-error-container/20 transition-colors disabled:opacity-50"
              title="Platform-admin only: discard all collected signatures and put the lease back in draft."
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset Signatures
            </button>
          )}
        </div>
      )}

      {/* Save as Template modal */}
      {showSaveAsTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => !savingAsTemplate && setShowSaveAsTemplate(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">
                    bookmark_add
                  </span>
                </div>
                <div>
                  <h2 className="font-headline text-lg font-extrabold text-primary">
                    Save as Template
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    Saves this lease&apos;s documents as a template you can reuse for future tenants.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-primary mb-2">
                  Template Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Alberta Furnished Suite (Standard)"
                  className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-primary mb-2">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="What makes this template useful?"
                  className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-container-low flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveAsTemplate(false)}
                disabled={savingAsTemplate}
                className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={savingAsTemplate || !templateName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  {savingAsTemplate ? "progress_activity" : "save"}
                </span>
                {savingAsTemplate ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lease Lifecycle (Terminate / Delete) — only when not editing a sub-document */}
      {!documentId && leaseStatus && (leaseStatus === "active" || leaseStatus === "draft") && (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden border border-error/20">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error">warning</span>
              <h2 className="text-lg font-headline font-bold text-error">Danger Zone</h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              {leaseStatus === "active"
                ? "Terminating a lease ends it immediately and sets the end date to today. This cannot be undone."
                : "This lease is in draft. You can permanently delete it (and all its draft documents) before sending for signing."}
            </p>
            <div className="flex flex-wrap gap-3">
              {leaseStatus === "active" && (
                <button
                  type="button"
                  onClick={handleTerminateLease}
                  disabled={terminatingLease}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">
                    {terminatingLease ? "progress_activity" : "gavel"}
                  </span>
                  {terminatingLease ? "Terminating..." : "Terminate Lease"}
                </button>
              )}
              {leaseStatus === "draft" && (
                <button
                  type="button"
                  onClick={handleDeleteLease}
                  disabled={deletingLease}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">
                    {deletingLease ? "progress_activity" : "delete_forever"}
                  </span>
                  {deletingLease ? "Deleting..." : "Delete Draft Lease"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Signatures confirmation modal (platform-admin only) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => !resettingSignatures && setShowResetConfirm(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-error-container text-xl">
                    warning
                  </span>
                </div>
                <h2 className="font-headline text-lg font-extrabold text-primary">
                  Reset Signatures?
                </h2>
              </div>
              <div className="space-y-2 text-sm text-on-surface-variant">
                <p>
                  This will discard every signature collected on this lease,
                  cancel all signing requests, and put the lease (and Schedule
                  A / B documents) back into <strong>draft</strong>.
                </p>
                <p>
                  Generated signed PDFs will also be removed from the documents
                  repository so the tenant won&apos;t see stale copies.
                </p>
                <p className="text-on-surface font-bold">
                  This action is intended for re-running the signing flow with
                  test tenants. It cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resettingSignatures}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSignatures}
                disabled={resettingSignatures}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  {resettingSignatures ? "progress_activity" : "restart_alt"}
                </span>
                {resettingSignatures ? "Resetting..." : "Reset & Re-enable Signing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Activity Log — shows every email sent for this lease across
          all per-document signing flows. The provider's message ID is shown
          so the landlord can trace deliverability in the Resend dashboard. */}
      {emailLogs.length > 0 && (
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-sm">
          <h3 className="font-headline font-bold text-primary text-sm mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">mail</span>
            Email Activity ({emailLogs.length})
          </h3>
          <div className="space-y-2">
            {emailLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">
                      {log.email_type === "signing_reminder"
                        ? "notification_important"
                        : log.email_type === "signing_completed"
                          ? "task_alt"
                          : "send"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {log.recipient_name ?? log.recipient_email}
                      <span className="font-normal text-on-surface-variant text-xs ml-2">
                        &lt;{log.recipient_email}&gt;
                      </span>
                    </p>
                    {log.subject && (
                      <p className="text-xs text-on-surface-variant truncate">
                        {log.subject}
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant">
                      {new Date(log.sent_at).toLocaleString("en-CA", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      log.email_type === "signing_reminder"
                        ? "bg-secondary/10 text-secondary"
                        : log.email_type === "signing_completed"
                          ? "bg-tertiary/10 text-on-tertiary-fixed-variant"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {log.email_type === "signing_reminder"
                      ? "Reminder"
                      : log.email_type === "signing_completed"
                        ? "Completion"
                        : "Sent"}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      log.status === "sent"
                        ? "bg-tertiary/10 text-on-tertiary-fixed-variant"
                        : log.status === "failed"
                          ? "bg-error/10 text-error"
                          : "bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                {log.resend_message_id && (
                  <div className="ml-11 flex items-center gap-2 text-[10px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-xs">tag</span>
                    <span className="font-mono">{log.resend_message_id}</span>
                    <a
                      href={`https://resend.com/emails/${log.resend_message_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-bold hover:underline"
                    >
                      Open in Resend →
                    </a>
                  </div>
                )}
                {log.participant_id && (
                  <button
                    onClick={async () => {
                      if (!log.participant_id) return;
                      setResendingId(log.participant_id);
                      try {
                        const { resendParticipantEmail } = await import(
                          "@/app/admin/actions/signing-actions"
                        );
                        const result = await resendParticipantEmail(
                          log.participant_id
                        );
                        if (result.success) {
                          toast.success(
                            `Reminder sent to ${log.recipient_name ?? log.recipient_email}`
                          );
                          router.refresh();
                        } else {
                          toast.error(result.error ?? "Failed to resend.");
                        }
                      } catch {
                        toast.error("Failed to resend email.");
                      } finally {
                        setResendingId(null);
                      }
                    }}
                    disabled={resendingId === log.participant_id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-50"
                    title="Resend signing email"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {resendingId === log.participant_id
                        ? "progress_activity"
                        : "refresh"}
                    </span>
                    Resend
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Body — Paper look */}
      <div className="bg-white rounded-3xl shadow-ambient-sm overflow-hidden print:shadow-none print:rounded-none">
        {/* Document Header */}
        <div className="px-8 md:px-16 pt-12 pb-8 border-b border-outline-variant/10 text-center">
          <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight mb-1">
            RESIDENTIAL TENANCY AGREEMENT
          </h2>
          <p className="text-sm text-on-surface-variant font-medium">
            Province of Alberta &middot; {content.templateVersion}
          </p>
        </div>

        {/* Sections */}
        <div className="px-8 md:px-16 py-8 space-y-8">
          {/* Main lease clauses (excluding schedules) */}
          {content.sections
            .filter((section) => !section.id.startsWith("schedule-"))
            .map((section) => (
              <DocumentSection
                key={section.id}
                section={section}
                isReadOnly={isReadOnly}
                onUpdateClause={(clauseId, text) =>
                  updateClause(section.id, clauseId, text)
                }
              />
            ))}

          {/* Additional Terms */}
          <div>
            <h3 className="text-lg font-headline font-bold text-primary mb-4">
              13. Additional Terms
            </h3>
            {content.additionalTerms.length === 0 && isReadOnly ? (
              <p className="text-sm text-on-surface-variant italic">
                No additional terms.
              </p>
            ) : (
              <div className="space-y-3">
                {content.additionalTerms.map((clause, i) => (
                  <div
                    key={clause.id}
                    className="flex items-start gap-3 group"
                  >
                    <span className="text-sm text-on-surface-variant font-mono mt-1 flex-shrink-0">
                      {i + 1}.
                    </span>
                    {isReadOnly ? (
                      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap flex-1">
                        {clause.text}
                      </p>
                    ) : (
                      <>
                        <textarea
                          value={clause.text}
                          onChange={(e) => {
                            setContent({
                              ...content,
                              additionalTerms: content.additionalTerms.map((c) =>
                                c.id === clause.id
                                  ? { ...c, text: e.target.value }
                                  : c
                              ),
                            });
                          }}
                          rows={2}
                          className="flex-1 text-sm text-on-surface leading-relaxed bg-transparent border border-outline-variant/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                        />
                        <button
                          onClick={() => removeAdditionalTerm(clause.id)}
                          className="text-error opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                        >
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isReadOnly && (
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={additionalTermText}
                    onChange={(e) => setAdditionalTermText(e.target.value)}
                    placeholder="Type an additional term or clause..."
                    rows={2}
                    className="w-full text-sm text-on-surface bg-surface-container-low rounded-xl px-4 py-3 placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                  />
                </div>
                <button
                  onClick={addAdditionalTerm}
                  disabled={!additionalTermText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Clause
                </button>
              </div>
            )}
          </div>

          {/* Signature Blocks */}
          <div className="mt-12 pt-8 border-t border-outline-variant/20">
            <h3 className="text-lg font-headline font-bold text-primary mb-6">
              Signatures
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Owner/Landlord signature blocks */}
              {(recipients.filter((r) => r.role === "landlord").length > 0
                ? recipients.filter((r) => r.role === "landlord")
                : [{ name: "Landlord", email: "", role: "landlord", signingOrder: 1 }]
              ).map((owner, i) => (
                <div key={`owner-${i}`}>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">
                    {owner.role === "landlord" ? "Landlord / Owner" : owner.role}
                  </p>
                  <p className="text-xs text-on-surface-variant mb-6">{owner.name}</p>
                  <div className="border-b border-on-surface/30 mb-2 h-12" />
                  <p className="text-xs text-on-surface-variant">Signature</p>
                  <div className="border-b border-on-surface/30 mb-2 h-8 mt-4" />
                  <p className="text-xs text-on-surface-variant">
                    Printed Name &amp; Date
                  </p>
                </div>
              ))}

              {/* Tenant signature blocks */}
              {(recipients.filter((r) => r.role === "tenant").length > 0
                ? recipients.filter((r) => r.role === "tenant")
                : [{ name: "Tenant", email: "", role: "tenant", signingOrder: 1 }]
              ).map((tenant, i) => (
                <div key={`tenant-${i}`}>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">
                    Tenant
                  </p>
                  <p className="text-xs text-on-surface-variant mb-6">{tenant.name}</p>
                  <div className="border-b border-on-surface/30 mb-2 h-12" />
                  <p className="text-xs text-on-surface-variant">Signature</p>
                  <div className="border-b border-on-surface/30 mb-2 h-8 mt-4" />
                  <p className="text-xs text-on-surface-variant">
                    Printed Name &amp; Date
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Schedules — after main agreement and signatures */}
          {content.sections
            .filter((section) => section.id.startsWith("schedule-"))
            .map((section) => (
              <DocumentSection
                key={section.id}
                section={section}
                isReadOnly={isReadOnly}
                onUpdateClause={(clauseId, text) =>
                  updateClause(section.id, clauseId, text)
                }
              />
            ))}

          {/* Schedule Signature Blocks */}
          {content.sections.some((s) => s.id.startsWith("schedule-")) && (
            <div className="mt-8 pt-6 border-t border-outline-variant/20">
              <p className="text-sm text-on-surface-variant italic mb-6">
                By signing below, the parties acknowledge and agree to the details in the above schedules.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {(recipients.filter((r) => r.role === "landlord").length > 0
                  ? recipients.filter((r) => r.role === "landlord")
                  : [{ name: "Landlord", email: "", role: "landlord", signingOrder: 1 }]
                ).map((owner, i) => (
                  <div key={`sched-owner-${i}`}>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">
                      Landlord / Owner
                    </p>
                    <p className="text-xs text-on-surface-variant mb-6">{owner.name}</p>
                    <div className="border-b border-on-surface/30 mb-2 h-12" />
                    <p className="text-xs text-on-surface-variant">Signature &amp; Date</p>
                  </div>
                ))}
                {(recipients.filter((r) => r.role === "tenant").length > 0
                  ? recipients.filter((r) => r.role === "tenant")
                  : [{ name: "Tenant", email: "", role: "tenant", signingOrder: 1 }]
                ).map((tenant, i) => (
                  <div key={`sched-tenant-${i}`}>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">
                      Tenant
                    </p>
                    <p className="text-xs text-on-surface-variant mb-6">{tenant.name}</p>
                    <div className="border-b border-on-surface/30 mb-2 h-12" />
                    <p className="text-xs text-on-surface-variant">Signature &amp; Date</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
            <p className="text-xs text-on-surface-variant/60">
              Generated by TenantPorch &middot; Alberta Standard Residential
              Tenancy Agreement &middot; {content.templateVersion}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentSection({
  section,
  isReadOnly,
  onUpdateClause,
}: {
  section: LeaseSection;
  isReadOnly: boolean;
  onUpdateClause: (clauseId: string, text: string) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-headline font-bold text-primary mb-4">
        {section.title}
      </h3>
      <div className="space-y-4">
        {section.clauses.map((clause) => (
          <ClauseBlock
            key={clause.id}
            clause={clause}
            isReadOnly={isReadOnly || !clause.editable}
            onUpdate={(text) => onUpdateClause(clause.id, text)}
          />
        ))}
      </div>
    </div>
  );
}

function ClauseBlock({
  clause,
  isReadOnly,
  onUpdate,
}: {
  clause: LeaseClause;
  isReadOnly: boolean;
  onUpdate: (text: string) => void;
}) {
  if (isReadOnly) {
    return (
      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
        {clause.text}
      </p>
    );
  }

  return (
    <textarea
      value={clause.text}
      onChange={(e) => onUpdate(e.target.value)}
      rows={Math.max(2, clause.text.split("\n").length + 1)}
      className="w-full text-sm text-on-surface leading-relaxed bg-transparent border border-outline-variant/15 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-outline-variant/30 transition-colors resize-y"
    />
  );
}

function SigningStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-surface-variant", text: "text-on-surface-variant", label: "Draft" },
    sent: { bg: "bg-secondary-fixed/30", text: "text-on-secondary-fixed-variant", label: "Sent for Signing" },
    partially_signed: { bg: "bg-secondary-fixed/30", text: "text-on-secondary-fixed-variant", label: "Partially Signed" },
    completed: { bg: "bg-tertiary-fixed/30", text: "text-on-tertiary-fixed-variant", label: "Fully Signed" },
  };
  const s = styles[status] ?? styles.draft;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
