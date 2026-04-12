"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProperty } from "@/app/admin/actions/property-actions";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this property? This action cannot be undone. Properties with active leases cannot be deleted."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteProperty(propertyId);

      if (result.success) {
        toast.success("Property deleted successfully");
        router.push("/admin/properties");
      } else {
        toast.error(result.error || "Failed to delete property.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting ? (
        <>
          <span className="material-symbols-outlined text-sm animate-spin">
            progress_activity
          </span>
          Deleting...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-sm">delete</span>
          Delete Property
        </>
      )}
    </button>
  );
}
