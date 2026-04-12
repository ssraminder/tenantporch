"use client";

export type FeatureGateInfo = {
  name: string;
  description: string;
  benefits: string[];
  minPlanSlug: string | null;
  addonSlug: string | null;
  addonName: string | null;
  addonPrice: number | null;
};

const PLAN_ORDER = ["free", "starter", "growth", "pro", "enterprise"];

export function FeatureGateModal({
  open,
  onClose,
  feature,
  currentPlanSlug,
  onUpgradeClick,
  onAddonClick,
}: {
  open: boolean;
  onClose: () => void;
  feature: FeatureGateInfo | null;
  currentPlanSlug: string;
  onUpgradeClick: () => void;
  onAddonClick: (addonSlug: string) => void;
}) {
  if (!open || !feature) return null;

  const currentIdx = PLAN_ORDER.indexOf(currentPlanSlug);
  const requiredIdx = feature.minPlanSlug ? PLAN_ORDER.indexOf(feature.minPlanSlug) : 99;
  const canUpgradeToPlan = requiredIdx <= PLAN_ORDER.indexOf("pro");
  const hasAddonPath = !!feature.addonSlug;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold text-primary">Unlock Feature</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Feature info */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 mb-4">
              <span className="material-symbols-outlined text-3xl text-primary">lock</span>
            </div>
            <h3 className="font-headline text-xl font-bold text-primary mb-2">{feature.name}</h3>
            <p className="text-sm text-on-surface-variant">{feature.description}</p>
          </div>

          {/* Benefits */}
          {feature.benefits.length > 0 && (
            <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
              {feature.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim text-base mt-0.5">
                    check_circle
                  </span>
                  <span className="text-sm text-on-surface">{benefit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Screenshot placeholder */}
          <div className="bg-surface-container-high rounded-xl h-32 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-3xl text-outline-variant/40">image</span>
              <p className="text-xs text-outline-variant mt-1">Preview coming soon</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Plan upgrade path */}
            {canUpgradeToPlan && feature.minPlanSlug && currentIdx < requiredIdx && (
              <button
                onClick={() => {
                  onClose();
                  onUpgradeClick();
                }}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">upgrade</span>
                Available on {feature.minPlanSlug.charAt(0).toUpperCase() + feature.minPlanSlug.slice(1)}+ — Upgrade Plan
              </button>
            )}

            {/* Add-on path */}
            {hasAddonPath && (
              <button
                onClick={() => {
                  onClose();
                  onAddonClick(feature.addonSlug!);
                }}
                className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  canUpgradeToPlan && feature.minPlanSlug && currentIdx < requiredIdx
                    ? "border border-primary text-primary hover:bg-primary/5"
                    : "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container"
                }`}
              >
                <span className="material-symbols-outlined text-lg">extension</span>
                Add {feature.addonName} — ${feature.addonPrice}/mo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline lock indicator for gated features. Replaces feature content.
 */
export function FeatureLock({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined text-base text-outline-variant">lock</span>
      <button
        onClick={onClick}
        className="text-sm text-primary font-medium hover:underline underline-offset-2"
      >
        {label} — View Details
      </button>
    </div>
  );
}
