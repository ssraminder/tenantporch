"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Item = {
  id: string;
  item_name: string;
  quantity: number | null;
  room: string | null;
  year_of_purchase: number | null;
  estimated_value: number | null;
  currency_code: string | null;
  condition_at_movein: string | null;
  notes: string | null;
  photo_url: string | null;
  updated_at?: string | null;
};

interface Props {
  propertyId: string;
  initialItems: Item[];
}

const ROOM_OPTIONS = [
  "Living Room",
  "Bedroom 1",
  "Bedroom 2",
  "Kitchen",
  "Dining Area",
  "Bathroom",
  "Laundry / Utility",
  "Other / Property",
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const blankDraft: Partial<Item> = {
  item_name: "",
  quantity: 1,
  room: "Living Room",
  year_of_purchase: null,
  estimated_value: null,
  currency_code: "CAD",
  condition_at_movein: "good",
  notes: "",
  photo_url: "",
};

function formatCurrency(value: number, currency = "CAD") {
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function InventoryClient({ propertyId, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [draft, setDraft] = useState<Partial<Item> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalValue = useMemo(() => {
    return items.reduce((sum, it) => {
      const v = Number(it.estimated_value ?? 0);
      const q = Number(it.quantity ?? 1);
      return sum + v * q;
    }, 0);
  }, [items]);

  const itemsByRoom = useMemo(() => {
    const groups = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.room ?? "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [items]);

  function startAdd() {
    setEditingId(null);
    setDraft({ ...blankDraft });
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setDraft({ ...item });
  }

  function cancelDraft() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveDraft() {
    if (!draft) return;
    if (!draft.item_name?.trim()) {
      toast.error("Item name is required.");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      if (editingId) formData.set("id", editingId);
      formData.set("property_id", propertyId);
      formData.set("item_name", String(draft.item_name ?? ""));
      formData.set("quantity", String(draft.quantity ?? 1));
      if (draft.room) formData.set("room", draft.room);
      if (draft.year_of_purchase != null)
        formData.set("year_of_purchase", String(draft.year_of_purchase));
      if (draft.estimated_value != null)
        formData.set("estimated_value", String(draft.estimated_value));
      formData.set("currency_code", draft.currency_code ?? "CAD");
      if (draft.condition_at_movein)
        formData.set("condition_at_movein", draft.condition_at_movein);
      if (draft.notes) formData.set("notes", draft.notes);
      if (draft.photo_url) formData.set("photo_url", draft.photo_url);

      const { upsertInventoryItem } = await import(
        "@/app/admin/actions/inventory-actions"
      );
      const result = await upsertInventoryItem(formData);
      if (result.success) {
        toast.success(editingId ? "Item updated." : "Item added.");
        setEditingId(null);
        setDraft(null);
        router.refresh();
        // Optimistic update so the UI reflects immediately
        if (editingId) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === editingId ? ({ ...it, ...draft } as Item) : it
            )
          );
        } else {
          setItems((prev) => [
            ...prev,
            { ...(draft as Item), id: `temp-${Date.now()}` },
          ]);
        }
      } else {
        toast.error(result.error ?? "Failed to save item.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Item) {
    if (!confirm(`Delete "${item.item_name}"?`)) return;
    setDeletingId(item.id);
    try {
      const { deleteInventoryItem } = await import(
        "@/app/admin/actions/inventory-actions"
      );
      const result = await deleteInventoryItem(item.id, propertyId);
      if (result.success) {
        toast.success("Item deleted.");
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete item.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">
            Items Tracked
          </p>
          <p className="text-2xl font-headline font-extrabold text-primary mt-1">
            {items.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">
            Total Approximate Cost
          </p>
          <p className="text-2xl font-headline font-extrabold text-primary mt-1">
            {formatCurrency(totalValue, items[0]?.currency_code ?? "CAD")}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 sm:text-right">
          <button
            type="button"
            onClick={startAdd}
            disabled={!!draft}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Item
          </button>
        </div>
      </div>

      {/* Draft form */}
      {draft && (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-bold text-primary">
              {editingId ? "Edit Item" : "Add Item"}
            </h2>
            <button
              type="button"
              onClick={cancelDraft}
              className="text-sm text-on-surface-variant hover:text-primary"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Item Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={draft.item_name ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, item_name: e.target.value })
                }
                placeholder="e.g. Sofa (3-seater)"
                className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Room
              </label>
              <select
                value={draft.room ?? ""}
                onChange={(e) => setDraft({ ...draft, room: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                value={draft.quantity ?? 1}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    quantity: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Year of Purchase
              </label>
              <input
                type="number"
                min={1900}
                max={2100}
                value={draft.year_of_purchase ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    year_of_purchase: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  })
                }
                placeholder="e.g. 2024"
                className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Approximate Cost
              </label>
              <div className="flex gap-2">
                <select
                  value={draft.currency_code ?? "CAD"}
                  onChange={(e) =>
                    setDraft({ ...draft, currency_code: e.target.value })
                  }
                  className="px-2 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={draft.estimated_value ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      estimated_value: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Condition at Move-In
              </label>
              <select
                value={draft.condition_at_movein ?? "good"}
                onChange={(e) =>
                  setDraft({ ...draft, condition_at_movein: e.target.value })
                }
                className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Notes (optional)
              </label>
              <textarea
                rows={2}
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Brand, model, serial number, warranty, anything else worth tracking."
                className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Photo URL (optional)
              </label>
              <input
                type="url"
                value={draft.photo_url ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, photo_url: e.target.value })
                }
                placeholder="https://…"
                className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelDraft}
              className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                {saving ? "progress_activity" : "save"}
              </span>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Add Item"}
            </button>
          </div>
        </div>
      )}

      {/* Items grouped by room */}
      {items.length === 0 && !draft ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-outline-variant block">
            chair
          </span>
          <p className="text-sm text-on-surface-variant">
            No furnished items tracked yet. Add the first one above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {itemsByRoom.map(([room, roomItems]) => (
            <div key={room} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="font-headline text-base font-bold text-primary">
                  {room}
                </h3>
                <span className="text-xs text-on-surface-variant">
                  {roomItems.length} {roomItems.length === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-surface-container-low">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                      <th className="py-2 px-4">Item</th>
                      <th className="py-2 px-4">Qty</th>
                      <th className="py-2 px-4">Year</th>
                      <th className="py-2 px-4">Approx. Cost</th>
                      <th className="py-2 px-4">Condition</th>
                      <th className="py-2 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-outline-variant/15 hover:bg-surface-container-low/40"
                      >
                        <td className="py-3 px-4">
                          <p className="text-sm font-bold text-on-surface">
                            {item.item_name}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-on-surface">
                          {item.quantity ?? 1}
                        </td>
                        <td className="py-3 px-4 text-sm text-on-surface">
                          {item.year_of_purchase ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-on-surface">
                          {item.estimated_value != null
                            ? formatCurrency(
                                Number(item.estimated_value),
                                item.currency_code ?? "CAD"
                              )
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-on-surface-variant capitalize">
                          {item.condition_at_movein ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-surface-container-high"
                              aria-label="Edit"
                            >
                              <span className="material-symbols-outlined text-sm text-primary">
                                edit
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="p-1.5 rounded-lg hover:bg-error-container/30 disabled:opacity-50"
                              aria-label="Delete"
                            >
                              <span className="material-symbols-outlined text-sm text-error">
                                {deletingId === item.id
                                  ? "progress_activity"
                                  : "delete"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
