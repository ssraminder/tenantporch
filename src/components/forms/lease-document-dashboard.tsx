"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeaseDocument } from "@/lib/lease-documents";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";
import { SigningEmailPreviewModal, type SigningRecipient } from "./signing-email-preview-modal";
import type { EmailLogEntry } from "./lease-document-editor";

const DOCUMENT_TYPE_META: Record<
  string,
  { icon: string; description: string }
> = {
  lease_agreement: {
    icon: "description",
    description: "Main residential tenancy agreement",
  },
  schedule_a: {
    icon: "apartment",
    description: "Property details and amenities",
  },
  schedule_b: {
    icon: "badge",
    description: "Tenant identification details",
  },
  addendum: {
    icon: "post_add",
    description: "Lease addendum",
  },
  custom: {
    icon: "upload_file",
    description: "Custom document",
  },
};

const SIGNING_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: {
    bg: "bg-surface-variant",
    text: "text-on-surface-variant",
    label: "Draft",
  },
  sent: {
    bg: "bg-secondary-fixed/30",
    text: "text-on-secondary-fixed-variant",
    label: "Sent for Signing",
  },
  partially_signed: {
    bg: "bg-secondary-fixed/30",
    text: "text-on-secondary-fixed-variant",
    label: "Partially Signed",
  },
  completed: {
    bg: "bg-tertiary-fixed/30",
    text: "text-on-tertiary-fixed-variant",
    label: "Signed",
  },
  signed_offline: {
    bg: "bg-tertiary-fixed/30",
    text: "text-on-tertiary-fixed-variant",
    label: "Signed Offline",
  },
};

interface LeaseDocumentDashboardProps {
  leaseId: string;
  propertyId: string;
  propertyAddress: string;
  tenantCount: number;
  hasUnverifiedTenants: boolean;
  tenantDataStale: boolean;
  leaseDocuments: LeaseDocument[];
  signingStatus: string;
  recipients: SigningRecipient[];
  emailLogs: EmailLogEntry[];
  signedDocumentUrl: string | null;
}

export function LeaseDocumentDashboard({
  leaseId,
  propertyId,
  propertyAddress,
  tenantCount,
  hasUnverifiedTenants,
  tenantDataStale,
  leaseDocuments,
  signingStatus,
  recipients,
  emailLogs,
  signedDocumentUrl,
}: LeaseDocumentDashboardProps) {
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [sendingDocId, setSendingDocId] = useState<string | null>(null);
  const [cancellingDocId, setCancellingDocId] = useState<string | null>(null);
  const [showSigningPreview, setShowSigningPreview] = useState(false);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [signingDocTitle, setSigningDocTitle] = useState("");
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineDocId, setOfflineDocId] = useState<string | null>(null);
  const [offlineDocTitle, setOfflineDocTitle] = useState("");
  const [markingOffline, setMarkingOffline] = useState(false);
  const offlineFileRef = useRef<HTMLInputElement>(null);
  const [showIdOverrideDialog, setShowIdOverrideDialog] = useState(false);
  const [idOverrideAcknowledged, setIdOverrideAcknowledged] = useState(false);

  const allCompleted =
    leaseDocuments.length > 0 &&
    leaseDocuments.every(
      (d) =>
        d.signing_status === "completed" ||
        d.signing_status === "signed_offline"
    );

  function getSectionSummary(doc: LeaseDocument): string {
    const content = doc.document_content as LeaseDocumentContent | null;
    if (!content) return "No content generated yet";

    const sectionCount = content.sections?.length ?? 0;
    const termCount = content.additionalTerms?.length ?? 0;

    if (doc.document_type === "schedule_a") {
      const clauseCount =
        content.sections?.reduce(
          (sum, s) => sum + (s.clauses?.length ?? 0),
          0
        ) ?? 0;
      return `${clauseCount} detail${clauseCount !== 1 ? "s" : ""}`;
    }
    if (doc.document_type === "schedule_b") {
      const clauseCount =
        content.sections?.reduce(
          (sum, s) => sum + (s.clauses?.length ?? 0),
          0
        ) ?? 0;
      return `${clauseCount} tenant record${clauseCount !== 1 ? "s" : ""}`;
    }

    const parts: string[] = [];
    if (sectionCount > 0)
      parts.push(`${sectionCount} section${sectionCount !== 1 ? "s" : ""}`);
    if (termCount > 0)
      parts.push(
        `${termCount} additional term${termCount !== 1 ? "s" : ""}`
      );
    return parts.join(", ") || "Empty document";
  }

  async function handleDownloadPDF(doc: LeaseDocument) {
    if (
      (doc.signing_status === "completed" ||
        doc.signing_status === "signed_offline") &&
      doc.signed_pdf_url
    ) {
      window.open(doc.signed_pdf_url, "_blank");
      return;
    }

    const content = doc.document_content as LeaseDocumentContent | null;
    if (!content) {
      toast.error("No content to generate PDF from.");
      return;
    }

    setDownloadingId(doc.id);
    try {
      const { downloadLeasePDF } = await import(
        "@/lib/pdf/generate-lease-pdf"
      );
      const isDraft =
        doc.signing_status !== "completed" &&
        doc.signing_status !== "signed_offline";
      const filename = doc.title.replace(/[^a-zA-Z0-9]/g, "_");
      await downloadLeasePDF(content, `${filename}_${propertyAddress}`, isDraft);
      toast.success("PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleRegenerateAll() {
    setRegenerating(true);
    try {
      const { regenerateLeaseDocument } = await import(
        "@/app/admin/actions/lease-actions"
      );
      const result = await regenerateLeaseDocument(leaseId);
      if (result.success) {
        toast.success("Documents regenerated with latest data.");
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

  function handleSendClick(doc: LeaseDocument) {
    setSigningDocId(doc.id);
    setSigningDocTitle(doc.title);
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

  async function handleSendDocumentForSignatures() {
    if (!signingDocId) return;
    setSendingDocId(signingDocId);
    try {
      const { sendDocumentForSignatures } = await import(
        "@/app/admin/actions/document-signing-actions"
      );
      const result = await sendDocumentForSignatures(signingDocId, {
        overrideIdCheck: idOverrideAcknowledged,
      });
      if (result.success) {
        toast.success("Document sent for signatures. All parties have been notified.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to send for signatures.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSendingDocId(null);
      setSigningDocId(null);
    }
  }

  async function handleCancelDocumentSigning(docId: string) {
    setCancellingDocId(docId);
    try {
      const { cancelDocumentSigning } = await import(
        "@/app/admin/actions/document-signing-actions"
      );
      const result = await cancelDocumentSigning(docId);
      if (result.success) {
        toast.success("Signing cancelled. Document is back in draft.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to cancel signing.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setCancellingDocId(null);
    }
  }

  function handleSignOfflineClick(doc: LeaseDocument) {
    setOfflineDocId(doc.id);
    setOfflineDocTitle(doc.title);
    setShowOfflineModal(true);
  }

  async function handleMarkSignedOffline() {
    if (!offlineDocId) return;
    setMarkingOffline(true);
    try {
      const { markDocumentSignedOffline } = await import(
        "@/app/admin/actions/document-signing-actions"
      );
      const file = offlineFileRef.current?.files?.[0];
      let formData: FormData | undefined;
      if (file) {
        formData = new FormData();
        formData.append("file", file);
      }
      const result = await markDocumentSignedOffline(offlineDocId, formData);
      if (result.success) {
        toast.success("Document marked as signed offline.");
        setShowOfflineModal(false);
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

  function getEditUrl(doc: LeaseDocument): string {
    if (doc.id.startsWith("virtual-")) {
      return `/admin/leases/${leaseId}/document/edit`;
    }
    return `/admin/leases/${leaseId}/document/${doc.id}`;
  }

  if (leaseDocuments.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient-sm text-center">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
          description
        </span>
        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          No Documents Generated
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          This lease does not have any documents yet. Documents are generated
          automatically when you create a lease with tenants assigned.
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
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              folder_open
            </span>
            <div>
              <h1 className="font-headline font-extrabold text-xl text-primary">
                Lease Documents
              </h1>
              <p className="text-sm text-on-surface-variant">
                {propertyAddress} &middot; {tenantCount} tenant
                {tenantCount !== 1 ? "s" : ""} &middot; {leaseDocuments.length}{" "}
                document{leaseDocuments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {allCompleted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed/30 text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined text-xs">
                verified
              </span>
              All Documents Signed
            </span>
          )}
        </div>

        {/* Warning banners */}
        {tenantDataStale && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
            <span className="material-symbols-outlined text-amber-600">
              sync_problem
            </span>
            <p className="text-sm text-amber-800">
              Tenant information in the documents is outdated. Click{" "}
              <strong>Regenerate All</strong> to update with current tenant data.
            </p>
          </div>
        )}
        {hasUnverifiedTenants && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
            <span className="material-symbols-outlined text-amber-600">
              shield_person
            </span>
            <p className="text-sm text-amber-800">
              One or more tenants have unverified IDs. You can still send
              documents for signatures, but you&apos;ll need to verify their
              identity in person.
            </p>
          </div>
        )}
      </div>

      {/* Global Action Bar */}
      {!allCompleted && signingStatus === "draft" && (
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient-sm flex flex-wrap items-center gap-3">
          <button
            onClick={handleRegenerateAll}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {regenerating ? "progress_activity" : "autorenew"}
            </span>
            {regenerating ? "Regenerating..." : "Regenerate All"}
          </button>
        </div>
      )}

      {/* Document Cards */}
      <div className="space-y-4">
        {leaseDocuments.map((doc) => {
          const meta = DOCUMENT_TYPE_META[doc.document_type] ??
            DOCUMENT_TYPE_META.custom;
          const statusStyle =
            SIGNING_STATUS_STYLES[doc.signing_status] ??
            SIGNING_STATUS_STYLES.draft;
          const isDocReadOnly =
            doc.signing_status === "sent" ||
            doc.signing_status === "partially_signed" ||
            doc.signing_status === "completed" ||
            doc.signing_status === "signed_offline";
          const hasContent = !!doc.document_content;

          return (
            <div
              key={doc.id}
              className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {meta.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-headline font-bold text-on-surface truncate">
                        {doc.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      {hasContent
                        ? getSectionSummary(doc)
                        : meta.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {hasContent && !isDocReadOnly && (
                      <button
                        onClick={() => router.push(getEditUrl(doc))}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                        Edit
                      </button>
                    )}

                    {isDocReadOnly && hasContent && (
                      <button
                        onClick={() => router.push(getEditUrl(doc))}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container-highest transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          visibility
                        </span>
                        View
                      </button>
                    )}

                    {hasContent && (
                      <button
                        onClick={() => handleDownloadPDF(doc)}
                        disabled={downloadingId === doc.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {downloadingId === doc.id
                            ? "progress_activity"
                            : "picture_as_pdf"}
                        </span>
                        {downloadingId === doc.id ? "..." : "PDF"}
                      </button>
                    )}

                    {/* Send for Signatures — draft documents with content */}
                    {hasContent &&
                      doc.signing_status === "draft" &&
                      !doc.id.startsWith("virtual-") && (
                        <button
                          onClick={() => handleSendClick(doc)}
                          disabled={sendingDocId === doc.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {sendingDocId === doc.id
                              ? "progress_activity"
                              : "send"}
                          </span>
                          {sendingDocId === doc.id ? "..." : "Send for Signatures"}
                        </button>
                      )}

                    {/* Sign Offline — draft documents */}
                    {hasContent &&
                      doc.signing_status === "draft" &&
                      !doc.id.startsWith("virtual-") && (
                        <button
                          onClick={() => handleSignOfflineClick(doc)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant/30 text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            draw
                          </span>
                          Signed Offline
                        </button>
                      )}

                    {/* Cancel Signing — sent/partially signed documents */}
                    {(doc.signing_status === "sent" ||
                      doc.signing_status === "partially_signed") && (
                      <button
                        onClick={() => handleCancelDocumentSigning(doc.id)}
                        disabled={cancellingDocId === doc.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-error/30 text-error text-sm font-bold hover:bg-error-container/20 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {cancellingDocId === doc.id
                            ? "progress_activity"
                            : "cancel"}
                        </span>
                        {cancellingDocId === doc.id
                          ? "..."
                          : "Cancel Signing"}
                      </button>
                    )}

                    {!hasContent && (
                      <span className="text-xs text-on-surface-variant italic px-2">
                        Content not generated yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Email Activity Log (legacy — from existing signing flow) */}
      {signingStatus !== "draft" && emailLogs.length > 0 && (
        <EmailActivityLog emailLogs={emailLogs} />
      )}

      {/* Signing Email Preview Modal */}
      <SigningEmailPreviewModal
        open={showSigningPreview}
        onClose={() => {
          setShowSigningPreview(false);
          setSigningDocId(null);
        }}
        onConfirm={async () => {
          setShowSigningPreview(false);
          await handleSendDocumentForSignatures();
        }}
        sending={!!sendingDocId}
        recipients={recipients}
        propertyAddress={propertyAddress}
      />

      {/* ID Verification Override Dialog */}
      {showIdOverrideDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => {
              setShowIdOverrideDialog(false);
              setSigningDocId(null);
            }}
          />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
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
                One or more tenants have not completed ID verification. By
                proceeding, you acknowledge that you will verify each
                tenant&apos;s identity in person before handing over the keys.
              </p>
            </div>
            <div
              className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <button
                onClick={() => {
                  setShowIdOverrideDialog(false);
                  setSigningDocId(null);
                }}
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
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => {
              setShowOfflineModal(false);
              setOfflineDocId(null);
            }}
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
                    Mark as Signed Offline
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    {offlineDocTitle}
                  </p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Mark this document as signed outside the platform. You can
                optionally upload a scanned copy of the signed document.
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
            <div
              className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <button
                onClick={() => {
                  setShowOfflineModal(false);
                  setOfflineDocId(null);
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
                {markingOffline ? "Marking..." : "Mark as Signed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All-signed banner */}
      {allCompleted && signedDocumentUrl && (
        <div className="bg-tertiary-fixed/10 rounded-2xl p-5 flex items-center gap-4">
          <span className="material-symbols-outlined text-2xl text-on-tertiary-fixed-variant">
            verified
          </span>
          <div className="flex-1">
            <p className="font-headline font-bold text-on-tertiary-fixed-variant">
              All Documents Signed
            </p>
            <p className="text-sm text-on-surface-variant">
              All parties have signed all lease documents.
            </p>
          </div>
          <a
            href={signedDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              picture_as_pdf
            </span>
            Download Signed PDF
          </a>
        </div>
      )}
    </div>
  );
}

function EmailActivityLog({ emailLogs }: { emailLogs: EmailLogEntry[] }) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-sm">
      <h3 className="font-headline font-bold text-primary text-sm mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">mail</span>
        Email Activity
      </h3>
      <div className="space-y-2">
        {emailLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-sm">
                {log.email_type === "signing_reminder"
                  ? "notification_important"
                  : "send"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">
                {log.recipient_name ?? log.recipient_email}
              </p>
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
                  : "bg-primary/10 text-primary"
              }`}
            >
              {log.email_type === "signing_reminder" ? "Reminder" : "Sent"}
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
        ))}
      </div>
    </div>
  );
}
