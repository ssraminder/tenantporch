"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type {
  LandlordTemplateDocument,
  LandlordTemplateDefaults,
} from "@/lib/lease-templates/template-renderer";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";

interface Props {
  templateId: string;
  initialName: string;
  initialDescription: string;
  provinceCode: string;
  documents: LandlordTemplateDocument[];
  defaults: LandlordTemplateDefaults;
  readOnly: boolean;
}

const PLACEHOLDER_HINT = `Available placeholders (replaced when applied to a lease):
{{tenant_names}} {{tenant_block}} {{landlord_block}} {{landlord_block_names}}
{{landlord_address}} {{landlord_etransfer_email}} {{property_full_address}}
{{unit_description}} {{start_date_long}} {{end_date_long}} {{end_time_clause}}
{{monthly_rent}} {{first_rent_amount}} {{first_rent_date}} {{deposit_amount}}
{{deposit_paid_date}} {{holdover_rent}} {{utility_split_pct}} {{utility_split_words}}
{{late_fee_amount}} {{late_fee_grace_days}} {{nsf_fee}} {{card_surcharge_pct}}
{{max_occupants}} {{guest_consec_nights}} {{guest_monthly_nights}}
{{early_term_notice_days}} {{rent_due_day_ordinal}} {{permitted_occupant}}
{{agreement_date_long}}`;

export function LeaseTemplateEditor({
  templateId,
  initialName,
  initialDescription,
  provinceCode,
  documents: initialDocuments,
  defaults: initialDefaults,
  readOnly,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [documents, setDocuments] = useState<LandlordTemplateDocument[]>(
    initialDocuments
  );
  const [defaults] = useState<LandlordTemplateDefaults>(initialDefaults);
  const [saving, setSaving] = useState(false);
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [showHints, setShowHints] = useState(false);

  function updateClauseText(
    docIndex: number,
    sectionId: string,
    clauseId: string,
    newText: string
  ) {
    setDocuments((prev) =>
      prev.map((d, i) => {
        if (i !== docIndex) return d;
        const content = d.document_content as LeaseDocumentContent;
        return {
          ...d,
          document_content: {
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
          },
        };
      })
    );
  }

  function updateDocTitle(docIndex: number, title: string) {
    setDocuments((prev) =>
      prev.map((d, i) => (i === docIndex ? { ...d, title } : d))
    );
  }

  async function handleSave() {
    if (readOnly) return;
    if (!name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    setSaving(true);
    try {
      const { updateLeaseTemplate } = await import(
        "@/app/admin/actions/lease-template-actions"
      );
      const result = await updateLeaseTemplate(templateId, {
        name: name.trim(),
        description: description.trim() || null,
        defaults,
        documents,
      });
      if (result.success) {
        toast.success("Template saved.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save template.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  const activeDoc = documents[activeDocIndex];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              disabled={readOnly}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-2xl font-headline font-extrabold text-primary bg-transparent focus:outline-none disabled:opacity-70"
            />
            <p className="text-xs text-on-surface-variant mt-1">
              {provinceCode} · {readOnly ? "Read-only (system template)" : "Editable"}
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                {saving ? "progress_activity" : "save"}
              </span>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            disabled={readOnly}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowHints((v) => !v)}
          className="text-xs text-primary font-bold hover:underline"
        >
          {showHints ? "Hide" : "Show"} placeholder reference
        </button>
        {showHints && (
          <pre className="text-xs bg-surface-container-low rounded-xl p-3 text-on-surface-variant whitespace-pre-wrap">
            {PLACEHOLDER_HINT}
          </pre>
        )}
      </div>

      {/* Document tabs */}
      {documents.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-outline-variant block">
            insert_drive_file
          </span>
          <p className="text-sm text-on-surface-variant">
            This template has no documents yet. Apply it to a draft lease, edit the lease document, then use{" "}
            <strong>&quot;Save as my template&quot;</strong> to capture the structure.
          </p>
          <Link
            href="/admin/leases/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 mt-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Lease (apply this template)
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {documents.map((d, i) => (
              <button
                key={`${d.document_type}-${i}`}
                type="button"
                onClick={() => setActiveDocIndex(i)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  i === activeDocIndex
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {d.title}
              </button>
            ))}
          </div>

          {activeDoc && (
            <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={activeDoc.title}
                  disabled={readOnly}
                  onChange={(e) => updateDocTitle(activeDocIndex, e.target.value)}
                  className="w-full text-lg font-headline font-bold text-primary bg-surface-container-low rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
                />
              </div>

              {(activeDoc.document_content as LeaseDocumentContent).sections.map(
                (section) => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="font-headline text-base font-bold text-primary">
                      {section.title}
                    </h3>
                    {section.clauses.map((clause) => (
                      <div key={clause.id}>
                        <textarea
                          rows={Math.max(2, clause.text.split("\n").length)}
                          value={clause.text}
                          disabled={readOnly || !clause.editable}
                          onChange={(e) =>
                            updateClauseText(
                              activeDocIndex,
                              section.id,
                              clause.id,
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
                          title={
                            clause.editable
                              ? "Editable clause"
                              : "Locked clause (statutory wording)"
                          }
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
