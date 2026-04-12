"use client";

import { useState } from "react";
import { usePlanGate } from "@/components/shared/plan-gate-provider";
import { toast } from "sonner";

type AddonDisplay = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  setup_fee: number;
  min_plan_slug: string;
  active: boolean;
};

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

const PLAN_ORDER = ["free", "starter", "growth", "pro", "enterprise"];

export function SubscriptionSection({
  planName,
  planSlug,
  basePrice,
  includedProperties,
  overageRate,
  propertyCount,
  cardSurcharge,
  includesAllAddons,
  freeIdVerifications,
  subscriptionStatus,
  addons,
  stripeCustomerId,
}: {
  planName: string;
  planSlug: string;
  basePrice: number;
  includedProperties: number;
  overageRate: number;
  propertyCount: number;
  cardSurcharge: number;
  includesAllAddons: boolean;
  freeIdVerifications: number;
  subscriptionStatus: string;
  addons: AddonDisplay[];
  stripeCustomerId: string | null;
}) {
  const { openUpgradeModal, openAddonModal } = usePlanGate();
  const [portalLoading, setPortalLoading] = useState(false);

  const overage = Math.max(0, propertyCount - includedProperties);
  const monthlyCost = basePrice + overage * overageRate;

  async function handleBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Could not open billing portal");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">workspace_premium</span>
          <h3 className="font-headline font-bold text-lg">Subscription & Plan</h3>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="font-headline font-bold text-xl text-on-surface">{planName}</h4>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {subscriptionStatus}
            </span>
          </div>

          {/* Pricing breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Monthly Cost
              </p>
              <p className="text-2xl font-black font-headline text-primary">
                ${monthlyCost.toFixed(0)}
                <span className="text-xs text-on-surface-variant font-normal"> /mo</span>
              </p>
              {overage > 0 && (
                <p className="text-xs text-on-surface-variant mt-1">
                  ${basePrice} base + {overage} × ${overageRate} overage
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Properties
              </p>
              <p className="text-lg font-extrabold font-headline text-on-surface">
                {propertyCount} / {includedProperties} included
              </p>
              {overage > 0 && (
                <p className="text-xs text-secondary font-medium mt-1">
                  {overage} overage at ${overageRate}/ea
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Card Surcharge
              </p>
              <p className="text-lg font-extrabold font-headline text-on-surface">
                {cardSurcharge}%
              </p>
            </div>
          </div>

          {/* Property usage bar */}
          {includedProperties > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                  Property Usage
                </p>
                <p className="text-xs font-semibold text-on-surface-variant">
                  {propertyCount} / {includedProperties}
                </p>
              </div>
              <div className="overflow-hidden h-2.5 rounded-full bg-surface-container-high">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    propertyCount > includedProperties
                      ? "bg-gradient-to-r from-secondary to-error"
                      : "bg-gradient-to-r from-primary to-primary-container"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((propertyCount / Math.max(1, includedProperties)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ID verification quota */}
          <div className="bg-surface-container-low rounded-xl px-5 py-4 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Free ID Verifications
              </p>
              <p className="text-sm font-medium text-on-surface">
                {freeIdVerifications} per month
                {freeIdVerifications === 0 && (
                  <span className="text-xs text-on-surface-variant ml-1">($3.99/check)</span>
                )}
              </p>
            </div>
            {includesAllAddons && (
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Add-ons
                </p>
                <p className="text-sm font-medium text-tertiary-fixed-dim flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  All included
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end">
            {stripeCustomerId && (
              <button
                onClick={handleBillingPortal}
                disabled={portalLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">receipt_long</span>
                {portalLoading ? "Opening..." : "Billing History"}
              </button>
            )}
            <button
              onClick={openUpgradeModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">swap_horiz</span>
              Change Plan
            </button>
          </div>
        </div>
      </div>

      {/* Add-ons Grid */}
      {!includesAllAddons && (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
          <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">extension</span>
            <h3 className="font-headline font-bold text-lg">Add-ons</h3>
          </div>
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {addons.map((addon) => {
                const currentIdx = PLAN_ORDER.indexOf(planSlug);
                const requiredIdx = PLAN_ORDER.indexOf(addon.min_plan_slug);
                const planMet = currentIdx >= requiredIdx;

                return (
                  <div
                    key={addon.id}
                    className={`rounded-xl p-5 border flex flex-col ${
                      addon.active
                        ? "border-tertiary-fixed-dim/30 bg-tertiary-fixed/5"
                        : planMet
                          ? "border-outline-variant/10 bg-surface-container-lowest"
                          : "border-outline-variant/10 bg-surface-container-low opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`material-symbols-outlined text-xl ${addon.active ? "text-tertiary-fixed-dim" : "text-primary"}`}>
                        {ADDON_ICONS[addon.slug] ?? "extension"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-on-surface">{addon.name}</p>
                        {!planMet && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                            {addon.min_plan_slug}+
                          </span>
                        )}
                      </div>
                      {addon.active && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed/20 text-tertiary-fixed-dim px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mb-3 flex-grow line-clamp-2">
                      {addon.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">${addon.price}/mo</span>
                      {!addon.active && (
                        <button
                          onClick={() => openAddonModal(addon.slug)}
                          className="text-xs font-bold text-primary hover:underline underline-offset-2"
                        >
                          {planMet ? "Add" : "View"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
