"use client";

import { useState } from "react";
import { usePlanGate } from "@/components/shared/plan-gate-provider";
import { toast } from "sonner";

type FeatureItem = {
  key: string;
  name: string;
  description: string;
  benefits: string[];
  minPlanSlug: string | null;
  addonSlug: string | null;
  addonName: string | null;
  addonPrice: number | null;
  included: boolean;
  activeViaAddon: boolean;
};

type AddonItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  setup_fee: number;
  min_plan_slug: string;
  active: boolean;
};

const PLAN_ORDER = ["free", "starter", "growth", "pro", "enterprise"];
const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};

const FEATURE_ICONS: Record<string, string> = {
  pad_payments: "account_balance",
  utility_splitting: "electric_bolt",
  financial_reports: "bar_chart",
  lease_builder: "edit_document",
  unlimited_signing: "draw",
  t776_export: "receipt_long",
  lease_renewal: "autorenew",
  rent_increase_calc: "calculate",
  contractor_dispatch: "engineering",
  expense_tracker: "account_balance_wallet",
  noi_dashboard: "insights",
  api_access: "api",
  bulk_operations: "dynamic_feed",
  advanced_analytics: "analytics",
  sms_notifications: "sms",
  ai_assistant: "smart_toy",
  recurring_card: "credit_card",
};

const CATEGORIES: { key: string; label: string; icon: string; features: string[] }[] = [
  {
    key: "payments",
    label: "Payments & Collection",
    icon: "payments",
    features: ["pad_payments", "recurring_card", "utility_splitting"],
  },
  {
    key: "leases",
    label: "Leases & Compliance",
    icon: "gavel",
    features: ["lease_builder", "unlimited_signing", "lease_renewal", "rent_increase_calc", "t776_export"],
  },
  {
    key: "operations",
    label: "Operations",
    icon: "handyman",
    features: ["contractor_dispatch", "expense_tracker"],
  },
  {
    key: "analytics",
    label: "Analytics & Reporting",
    icon: "insights",
    features: ["financial_reports", "noi_dashboard", "advanced_analytics"],
  },
  {
    key: "communication",
    label: "Communication & AI",
    icon: "forum",
    features: ["sms_notifications", "ai_assistant"],
  },
  {
    key: "integrations",
    label: "Integrations & Scale",
    icon: "hub",
    features: ["api_access", "bulk_operations"],
  },
];

export function PlanServices({
  planName,
  planSlug,
  monthlyCost,
  includedProperties,
  propertyCount,
  overageRate,
  freeIdVerifications,
  includesAllAddons,
  subscriptionStatus,
  features,
  addons,
  hasStripeCustomer,
}: {
  planName: string;
  planSlug: string;
  monthlyCost: number;
  includedProperties: number;
  propertyCount: number;
  overageRate: number;
  freeIdVerifications: number;
  includesAllAddons: boolean;
  subscriptionStatus: string;
  features: FeatureItem[];
  addons: AddonItem[];
  hasStripeCustomer: boolean;
}) {
  const { openUpgradeModal, openAddonModal } = usePlanGate();
  const [portalLoading, setPortalLoading] = useState(false);

  const featureMap = Object.fromEntries(features.map((f) => [f.key, f]));
  const overage = Math.max(0, propertyCount - includedProperties);

  const includedCount = features.filter((f) => f.included).length;
  const totalCount = features.length;

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
      {/* ─── Plan Overview Card ─── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="bg-primary p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl">
                  workspace_premium
                </span>
                <h2 className="font-headline text-xl md:text-2xl font-bold text-on-primary">
                  {planName} Plan
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 text-on-primary px-2 py-0.5 rounded-full">
                  {subscriptionStatus}
                </span>
              </div>
              <p className="text-inverse-primary/70 text-sm">
                {includedCount} of {totalCount} services included
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl md:text-4xl font-black font-headline text-on-primary">
                ${monthlyCost.toFixed(0)}
              </span>
              <span className="text-inverse-primary/70 text-sm">/mo</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-[10px] text-inverse-primary/60 uppercase tracking-wider font-semibold mb-0.5">
                Properties
              </p>
              <p className="text-sm font-bold text-on-primary">
                {propertyCount} / {includedProperties}
                {overage > 0 && (
                  <span className="text-secondary-fixed text-xs font-normal ml-1">
                    +{overage} overage
                  </span>
                )}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-[10px] text-inverse-primary/60 uppercase tracking-wider font-semibold mb-0.5">
                Overage Rate
              </p>
              <p className="text-sm font-bold text-on-primary">
                {overageRate > 0 ? `$${overageRate}/property` : "N/A"}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-[10px] text-inverse-primary/60 uppercase tracking-wider font-semibold mb-0.5">
                ID Verifications
              </p>
              <p className="text-sm font-bold text-on-primary">
                {freeIdVerifications > 0
                  ? `${freeIdVerifications} free/mo`
                  : "$3.99/check"}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-[10px] text-inverse-primary/60 uppercase tracking-wider font-semibold mb-0.5">
                Add-ons
              </p>
              <p className="text-sm font-bold text-on-primary">
                {includesAllAddons ? (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary-fixed text-sm">
                      check_circle
                    </span>
                    All included
                  </span>
                ) : (
                  `${addons.filter((a) => a.active).length} active`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 md:px-8 py-4 flex flex-wrap gap-3 justify-end border-t border-outline-variant/10">
          {hasStripeCustomer && (
            <button
              onClick={handleBillingPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/20 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                receipt_long
              </span>
              {portalLoading ? "Opening..." : "Billing"}
            </button>
          )}
          <button
            onClick={openUpgradeModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">
              swap_horiz
            </span>
            Change Plan
          </button>
        </div>
      </div>

      {/* ─── Service Categories ─── */}
      {CATEGORIES.map((cat) => {
        const catFeatures = cat.features
          .map((fk) => featureMap[fk])
          .filter(Boolean);
        if (catFeatures.length === 0) return null;

        return (
          <div
            key={cat.key}
            className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden"
          >
            <div className="px-6 md:px-8 py-4 bg-surface-container-highest flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                {cat.icon}
              </span>
              <h3 className="font-headline font-bold text-base">
                {cat.label}
              </h3>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {catFeatures.map((feature) => (
                <FeatureRow
                  key={feature.key}
                  feature={feature}
                  planSlug={planSlug}
                  onUpgrade={openUpgradeModal}
                  onAddon={openAddonModal}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeatureRow({
  feature,
  planSlug,
  onUpgrade,
  onAddon,
}: {
  feature: FeatureItem;
  planSlug: string;
  onUpgrade: () => void;
  onAddon: (slug: string) => void;
}) {
  const icon = FEATURE_ICONS[feature.key] ?? "extension";
  const currentIdx = PLAN_ORDER.indexOf(planSlug);
  const requiredIdx = feature.minPlanSlug
    ? PLAN_ORDER.indexOf(feature.minPlanSlug)
    : -1;

  // Determine status
  let status: "included" | "addon-active" | "addon-available" | "upgrade-needed";
  if (feature.included && !feature.activeViaAddon) {
    status = "included";
  } else if (feature.activeViaAddon) {
    status = "addon-active";
  } else if (feature.addonSlug && currentIdx >= requiredIdx) {
    status = "addon-available";
  } else {
    status = "upgrade-needed";
  }

  return (
    <div className="px-6 md:px-8 py-4 flex items-center gap-4">
      {/* Icon */}
      <div
        className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
          status === "included" || status === "addon-active"
            ? "bg-primary/10"
            : "bg-surface-container-high"
        }`}
      >
        <span
          className={`material-symbols-outlined text-xl ${
            status === "included" || status === "addon-active"
              ? "text-primary"
              : "text-on-surface-variant/50"
          }`}
        >
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${
            status === "included" || status === "addon-active"
              ? "text-on-surface"
              : "text-on-surface-variant"
          }`}
        >
          {feature.name}
        </p>
        <p className="text-xs text-on-surface-variant line-clamp-1 hidden sm:block">
          {feature.description}
        </p>
      </div>

      {/* Status / Action */}
      <div className="shrink-0">
        {status === "included" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-tertiary-fixed-dim bg-tertiary-fixed/10 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-sm">
              check_circle
            </span>
            Included
          </span>
        )}

        {status === "addon-active" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-tertiary-fixed-dim bg-tertiary-fixed/10 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-sm">
              check_circle
            </span>
            Add-on active
          </span>
        )}

        {status === "addon-available" && (
          <button
            onClick={() => feature.addonSlug && onAddon(feature.addonSlug)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 px-3 py-1.5 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            +${feature.addonPrice}/mo
          </button>
        )}

        {status === "upgrade-needed" && (
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest px-3 py-1.5 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="hidden sm:inline">
              {feature.minPlanSlug
                ? `${PLAN_LABELS[feature.minPlanSlug] ?? feature.minPlanSlug}+`
                : "Upgrade"}
            </span>
            <span className="sm:hidden">Upgrade</span>
          </button>
        )}
      </div>
    </div>
  );
}
