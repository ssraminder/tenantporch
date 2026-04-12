"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface PropertyOwner {
  id: string;
  user_id: string;
  designation: string;
  is_primary: boolean;
  first_name: string;
  last_name: string;
  email: string;
}

interface PropertyOwnersSectionProps {
  propertyId: string;
  owners: PropertyOwner[];
}

const DESIGNATION_LABELS: Record<string, string> = {
  owner: "Owner",
  property_manager: "Property Manager",
  signing_authority: "Signing Authority",
};

const DESIGNATION_COLORS: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  property_manager: "bg-secondary/10 text-secondary",
  signing_authority: "bg-tertiary/10 text-on-tertiary-fixed-variant",
};

export function PropertyOwnersSection({
  propertyId,
  owners,
}: PropertyOwnersSectionProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("owner");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleAddOwner(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setAdding(true);
    try {
      const { addPropertyOwner } = await import(
        "@/app/admin/actions/property-actions"
      );
      const result = await addPropertyOwner(propertyId, email, designation);
      if (result.success) {
        toast.success(`${result.ownerName} added as ${DESIGNATION_LABELS[designation]}`);
        setEmail("");
        setDesignation("owner");
        setShowAddForm(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to add owner.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveOwner(ownerId: string) {
    setRemovingId(ownerId);
    try {
      const { removePropertyOwner } = await import(
        "@/app/admin/actions/property-actions"
      );
      const result = await removePropertyOwner(ownerId);
      if (result.success) {
        toast.success("Owner removed.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to remove owner.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleUpdateDesignation(ownerId: string, newDesignation: string) {
    setUpdatingId(ownerId);
    try {
      const { updateOwnerDesignation } = await import(
        "@/app/admin/actions/property-actions"
      );
      const result = await updateOwnerDesignation(ownerId, newDesignation);
      if (result.success) {
        toast.success("Designation updated.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">group</span>
          Property Owners
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-secondary hover:bg-secondary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">
            {showAddForm ? "close" : "person_add"}
          </span>
          {showAddForm ? "Cancel" : "Add Owner"}
        </button>
      </div>

      {/* Owners list */}
      <div className="space-y-2 mb-4">
        {owners.map((owner) => (
          <div
            key={owner.id}
            className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-sm">
                {owner.is_primary ? "star" : "person"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">
                {owner.first_name} {owner.last_name}
                {owner.is_primary && (
                  <span className="text-[10px] font-bold text-on-surface-variant ml-2">
                    PRIMARY
                  </span>
                )}
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                {owner.email}
              </p>
            </div>

            {/* Designation selector */}
            <select
              value={owner.designation}
              onChange={(e) => handleUpdateDesignation(owner.id, e.target.value)}
              disabled={updatingId === owner.id}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border-0 cursor-pointer appearance-none text-center ${
                DESIGNATION_COLORS[owner.designation] ??
                "bg-surface-variant text-on-surface-variant"
              } disabled:opacity-50`}
            >
              <option value="owner">Owner</option>
              <option value="property_manager">Property Manager</option>
              <option value="signing_authority">Signing Authority</option>
            </select>

            {/* Remove button (not for primary) */}
            {!owner.is_primary && (
              <button
                onClick={() => handleRemoveOwner(owner.id)}
                disabled={removingId === owner.id}
                className="text-error/60 hover:text-error transition-colors disabled:opacity-50"
                title="Remove owner"
              >
                <span className="material-symbols-outlined text-sm">
                  {removingId === owner.id ? "progress_activity" : "close"}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-on-surface-variant mb-1">
        Owners and Signing Authorities are listed on the lease and queued for
        signature. Property Managers are not included in signing.
      </p>

      {/* Add owner form */}
      {showAddForm && (
        <form onSubmit={handleAddOwner} className="mt-4 p-4 bg-surface-container-low rounded-xl space-y-3">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              required
              className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              Designation
            </label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="owner">Owner</option>
              <option value="property_manager">Property Manager</option>
              <option value="signing_authority">Signing Authority</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={adding || !email.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {adding ? "progress_activity" : "person_add"}
            </span>
            {adding ? "Adding..." : "Add Owner"}
          </button>
        </form>
      )}
    </div>
  );
}
