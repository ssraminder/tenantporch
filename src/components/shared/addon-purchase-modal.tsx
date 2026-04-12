"use client";

import { useState } from "react";
import { toast } from "sonner";

export type AddonInfo = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  setup_fee: number;
  min_plan_slug: string;
};

const PLAN_ORDER = ["free", "starter", "growth", "pro", "enterprise"];

const ADDON_ICONS: Record<string, string> = {
  pad_auto_debit: "account_balance",
  reduced_card_surcharge: "credit_score",
  recurring_card: "autorenew",
  compliance: "gavel",
  ai_assistant: "smart_toy",
  sms: "sms",
  api_access: "api",
  bulk_ops: "dynamic_feed",
  advanced_analytics: "insights",
};

export function AddonPurchaseModal({
  open,
  onClose,
  addon,
  currentPlanSlug,
  onUpgradeClick,
}: {
  open: boolean;
  onClose: () => void;
  addon: AddonInfo | null;
  currentPlanSlug: string;
  onUpgradeClick: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!open || !addon) return null;

  const currentIdx = PLAN_ORDER.indexOf(currentPlanSlug);
  const requiredIdx = PLAN_ORDER.indexOf(addon.min_plan_slug);
  const planMet = currentIdx >= requiredIdx;

  async function handlePurchase() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/addon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addonSlug: addon!.slug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast.success(`${addon!.name} activated!`);
        onClose();
        window.location.reload();
      } else {
        toast.error(data.error ?? "Failed to add add-on");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold text-primary">Add-on</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Addon info */}
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-3xl text-primary bg-primary/5 p-3 rounded-xl">
              {ADDON_ICONS[addon.slug] ?? "extension"}
            </span>
            <div>
              <h3 className="font-bold text-lg text-on-surface">{addon.name}</h3>
              <p className="text-sm text-on-surface-variant mt-1">{addon.description}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">Monthly</span>
              <span className="text-lg font-black text-primary">${addon.price}/mo</span>
            </div>
            {addon.setup_fee > 0 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/10">
                <span className="text-sm text-on-surface-variant">One-time setup</span>
                <span className="text-sm font-bold text-on-surface">${addon.setup_fee}</span>
              </div>
            )}
          </div>

          {/* Action */}
          {planMet ? (
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : `Add — $${addon.price}/mo${addon.setup_fee > 0 ? ` + $${addon.setup_fee} setup` : ""}`}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 text-center">
                <p className="text-sm text-on-surface">
                  Requires <span className="font-bold capitalize">{addon.min_plan_slug}</span> plan or higher
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onUpgradeClick();
                }}
                className="w-full py-3 bg-secondary text-on-secondary font-bold rounded-xl hover:opacity-90 transition-colors"
              >
                Upgrade to {addon.min_plan_slug.charAt(0).toUpperCase() + addon.min_plan_slug.slice(1)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
