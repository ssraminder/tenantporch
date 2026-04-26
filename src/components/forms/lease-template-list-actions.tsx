"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  templateId: string;
}

export function LeaseTemplateListActions({ templateId }: Props) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const { duplicateLeaseTemplate } = await import(
        "@/app/admin/actions/lease-template-actions"
      );
      const result = await duplicateLeaseTemplate(templateId);
      if (result.success) {
        toast.success("Template duplicated.");
        router.push(`/admin/lease-templates/${result.templateId}`);
      } else {
        toast.error(result.error ?? "Failed to duplicate template.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDuplicating(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this template? Existing leases that already used it will keep their content."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const { deleteLeaseTemplate } = await import(
        "@/app/admin/actions/lease-template-actions"
      );
      const result = await deleteLeaseTemplate(templateId);
      if (result.success) {
        toast.success("Template deleted.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete template.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={duplicating}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">
          {duplicating ? "progress_activity" : "content_copy"}
        </span>
        {duplicating ? "Duplicating..." : "Duplicate"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-error/30 text-error text-xs font-bold hover:bg-error-container/20 transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">
          {deleting ? "progress_activity" : "delete"}
        </span>
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </>
  );
}
