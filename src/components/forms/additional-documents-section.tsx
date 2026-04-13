"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeaseDocument } from "@/lib/lease-documents";
import { usePlanGate } from "@/components/shared/plan-gate-provider";

interface AdditionalDocumentsSectionProps {
  leaseId: string;
  documents: LeaseDocument[];
}

export function AdditionalDocumentsSection({
  leaseId,
  documents,
}: AdditionalDocumentsSectionProps) {
  const router = useRouter();
  const { isAvailable, openFeatureGate } = usePlanGate();
  const canCustomize = isAvailable("custom_lease_documents");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter to show only non-lease-agreement docs (schedules, custom, addendum)
  const additionalDocs = documents.filter(
    (d) => d.document_type !== "lease_agreement"
  );

  async function handleAddDocument() {
    if (!addTitle.trim()) return;
    setAdding(true);
    try {
      const { addDocumentToLease } = await import(
        "@/app/admin/actions/lease-actions"
      );
      const formData = new FormData();
      formData.append("title", addTitle.trim());
      const file = fileRef.current?.files?.[0];
      if (file) formData.append("file", file);
      const result = await addDocumentToLease(leaseId, formData);
      if (result.success) {
        toast.success("Document added.");
        setShowAddModal(false);
        setAddTitle("");
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to add document.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(docId: string) {
    setRemovingId(docId);
    try {
      const { removeDocumentFromLease } = await import(
        "@/app/admin/actions/lease-actions"
      );
      const result = await removeDocumentFromLease(docId);
      if (result.success) {
        toast.success("Document removed.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to remove.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleDownload(doc: LeaseDocument) {
    if (doc.file_url) {
      window.open(doc.file_url, "_blank");
      return;
    }
    if (!doc.document_content) {
      toast.error("No content to download.");
      return;
    }
    setDownloadingId(doc.id);
    try {
      const { downloadLeasePDF } = await import("@/lib/pdf/generate-lease-pdf");
      await downloadLeasePDF(doc.document_content as any, doc.title, true);
      toast.success("PDF downloaded.");
    } catch {
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloadingId(null);
    }
  }

  const DOCUMENT_ICONS: Record<string, string> = {
    schedule_a: "apartment",
    schedule_b: "badge",
    addendum: "post_add",
    custom: "upload_file",
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            folder_open
          </span>
          <div>
            <h2 className="font-headline font-bold text-lg text-primary">
              Additional Documents
            </h2>
            <p className="text-xs text-on-surface-variant">
              Schedules, addendums, and custom documents for this lease
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (canCustomize) {
              setShowAddModal(true);
            } else {
              openFeatureGate("custom_lease_documents");
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-sm font-bold hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-sm">
            {canCustomize ? "add" : "lock"}
          </span>
          Add Document
        </button>
      </div>

      {/* Document list */}
      {additionalDocs.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 block">
            note_add
          </span>
          <p className="text-sm text-on-surface-variant">
            No additional documents yet. Add Schedule A, Schedule B, pet policies, or custom documents.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {additionalDocs.map((doc) => {
            const icon = DOCUMENT_ICONS[doc.document_type] ?? "description";
            const hasFile = !!doc.file_url;
            const hasContent = !!doc.document_content;
            const isCustomDraft =
              doc.document_type === "custom" && doc.signing_status === "draft";

            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">
                    {icon}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">
                    {doc.title}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {doc.document_type === "custom" && hasFile
                      ? "Uploaded PDF"
                      : doc.document_type === "custom"
                        ? "Custom document"
                        : hasContent
                          ? "Generated from template"
                          : "No content yet"}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {(hasFile || hasContent) && (
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {downloadingId === doc.id
                          ? "progress_activity"
                          : "download"}
                      </span>
                      {hasFile ? "Open" : "PDF"}
                    </button>
                  )}

                  {hasContent && !doc.id.startsWith("virtual-") && (
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/leases/${leaseId}/document/${doc.id}`
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs">
                        visibility
                      </span>
                      View
                    </button>
                  )}

                  {canCustomize && isCustomDraft && (
                    <button
                      onClick={() => handleRemove(doc.id)}
                      disabled={removingId === doc.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-error text-xs font-bold hover:bg-error-container/20 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {removingId === doc.id ? "progress_activity" : "delete"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setAddTitle("");
            }}
          />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary text-xl">
                    add
                  </span>
                </div>
                <h2 className="font-headline text-lg font-extrabold text-primary">
                  Add Document
                </h2>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g., Schedule A, Pet Policy, Parking Agreement..."
                  className="w-full text-sm bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/20 placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">
                  Upload PDF (optional)
                </label>
                <input
                  ref={fileRef}
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
                  setShowAddModal(false);
                  setAddTitle("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={!addTitle.trim() || adding}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  {adding ? "progress_activity" : "add"}
                </span>
                {adding ? "Adding..." : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
