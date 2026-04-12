"use client";

import { usePlanGate } from "@/components/shared/plan-gate-provider";

const DASHBOARD_FEATURES = [
  { key: "sms_notifications", name: "SMS Notifications", icon: "sms" },
  { key: "pad_payments", name: "PAD Auto-Debit", icon: "account_balance" },
  { key: "recurring_card", name: "Recurring Cards", icon: "autorenew" },
  { key: "advanced_analytics", name: "Advanced Analytics", icon: "insights" },
];

export function DashboardFeatureCards() {
  const { isAvailable, openFeatureGate, openUpgradeModal } = usePlanGate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {DASHBOARD_FEATURES.map((feature) => {
        const available = isAvailable(feature.key);

        return (
          <div
            key={feature.key}
            className={`relative rounded-2xl p-5 shadow-ambient-sm transition-colors ${
              available
                ? "bg-secondary-fixed/20 border border-secondary-fixed/30"
                : "bg-surface-container-high/60 border border-outline-variant/20"
            }`}
          >
            {!available && (
              <div className="absolute top-3 right-3">
                <span className="material-symbols-outlined text-outline-variant text-lg">
                  lock
                </span>
              </div>
            )}

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                available
                  ? "bg-secondary-fixed/40"
                  : "bg-surface-container-highest/60"
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg ${
                  available
                    ? "text-on-secondary-fixed-variant"
                    : "text-outline-variant"
                }`}
              >
                {feature.icon}
              </span>
            </div>

            <p
              className={`text-sm font-bold mb-1 ${
                available
                  ? "text-on-secondary-fixed-variant"
                  : "text-on-surface-variant"
              }`}
            >
              {feature.name}
            </p>

            {available ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-fixed-variant">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                Active
              </span>
            ) : (
              <button
                onClick={() => openFeatureGate(feature.key)}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-outline-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-xs">info</span>
                View Details
              </button>
            )}
          </div>
        );
      })}

      {/* Upgrade card */}
      <button
        onClick={openUpgradeModal}
        className="rounded-2xl p-5 shadow-ambient-sm bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-primary/10">
          <span className="material-symbols-outlined text-lg text-primary">upgrade</span>
        </div>
        <p className="text-sm font-bold text-primary mb-1">Explore Plans</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary/60">
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
          Compare
        </span>
      </button>
    </div>
  );
}
