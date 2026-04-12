"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";

export type PlanInfo = {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  included_properties: number;
  overage_rate: number;
  card_surcharge_percent: number;
  includes_all_addons: boolean;
  free_id_verifications_per_month: number;
};

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free: ["1 property", "e-Transfer tracking", "1 e-signature/year"],
  starter: ["3 properties included", "Unlimited e-signatures", "PAD auto-debit", "Lease builder"],
  growth: ["10 properties included", "T776 export", "Lease renewal", "1 free ID/mo"],
  pro: ["20 properties included", "All add-ons free", "API access", "2 free IDs/mo"],
};

function calcCost(plan: PlanInfo, count: number): number | null {
  if (plan.slug === "free" && count > 1) return null;
  if (plan.slug === "enterprise") return null;
  return plan.base_price + Math.max(0, count - plan.included_properties) * plan.overage_rate;
}

export function PlanUpgradeModal({
  open,
  onClose,
  plans,
  currentPlanSlug,
  propertyCount,
}: {
  open: boolean;
  onClose: () => void;
  plans: PlanInfo[];
  currentPlanSlug: string;
  propertyCount: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const displayPlans = useMemo(
    () => plans.filter((p) => p.slug !== "enterprise"),
    [plans]
  );

  const planCosts = useMemo(() => {
    const costs: Record<string, number | null> = {};
    for (const p of displayPlans) {
      costs[p.slug] = calcCost(p, propertyCount);
    }
    return costs;
  }, [displayPlans, propertyCount]);

  // Find recommended: cheapest plan that can hold current property count
  const recommendedSlug = useMemo(() => {
    let best: { slug: string; cost: number } | null = null;
    for (const p of displayPlans) {
      const cost = planCosts[p.slug];
      if (cost === null) continue;
      if (!best || cost < best.cost) best = { slug: p.slug, cost };
    }
    return best?.slug ?? "free";
  }, [displayPlans, planCosts]);

  async function handleUpgrade(planSlug: string) {
    if (planSlug === currentPlanSlug) return;
    setLoading(planSlug);
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast.success("Plan updated successfully!");
        onClose();
        window.location.reload();
      } else {
        toast.error(data.error ?? "Failed to update plan");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest z-10 px-6 md:px-8 py-5 border-b border-outline-variant/10 flex items-center justify-between">
          <div>
            <h2 className="font-headline text-xl font-bold text-primary">Choose Your Plan</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {propertyCount} {propertyCount === 1 ? "property" : "properties"} managed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {displayPlans.map((plan) => {
              const cost = planCosts[plan.slug];
              const isCurrent = plan.slug === currentPlanSlug;
              const isRecommended = plan.slug === recommendedSlug && !isCurrent;
              const isAvailable = cost !== null;
              const highlights = PLAN_HIGHLIGHTS[plan.slug] ?? [];
              const overage = Math.max(0, propertyCount - plan.included_properties);

              return (
                <div
                  key={plan.id}
                  className={`rounded-xl p-5 flex flex-col border transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isRecommended
                        ? "border-secondary bg-secondary/5"
                        : isAvailable
                          ? "border-outline-variant/10 bg-surface-container-lowest"
                          : "border-outline-variant/10 bg-surface-container-low opacity-50"
                  }`}
                >
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3 min-h-[24px]">
                    {isCurrent && (
                      <span className="bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                    {isRecommended && (
                      <span className="bg-secondary text-on-secondary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-primary mb-2">{plan.name}</h3>

                  {/* Price */}
                  {plan.slug === "free" ? (
                    <p className="text-2xl font-black text-primary mb-1">$0<span className="text-sm font-normal text-on-surface-variant">/mo</span></p>
                  ) : (
                    <>
                      <p className="text-2xl font-black text-primary mb-0.5">
                        ${plan.base_price}<span className="text-sm font-normal text-on-surface-variant">/mo</span>
                      </p>
                      {isAvailable && (
                        <p className="text-xs text-on-surface-variant mb-1">
                          {overage > 0
                            ? `$${cost?.toFixed(0)}/mo at ${propertyCount} properties`
                            : `${plan.included_properties} properties included`}
                        </p>
                      )}
                    </>
                  )}

                  {/* Highlights */}
                  <ul className="space-y-2 my-4 flex-grow">
                    {highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs text-on-surface">
                        <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm mt-px">check_circle</span>
                        {h}
                      </li>
                    ))}
                  </ul>

                  {/* Action */}
                  {isCurrent ? (
                    <div className="py-2.5 text-center text-sm font-semibold text-primary border border-primary rounded-lg">
                      Current Plan
                    </div>
                  ) : isAvailable ? (
                    <button
                      onClick={() => handleUpgrade(plan.slug)}
                      disabled={!!loading}
                      className="py-2.5 text-center text-sm font-bold rounded-lg transition-all bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50"
                    >
                      {loading === plan.slug ? "Redirecting..." : plan.slug === "free" ? "Downgrade" : "Upgrade"}
                    </button>
                  ) : (
                    <div className="py-2.5 text-center text-xs text-on-surface-variant border border-outline-variant/20 rounded-lg">
                      Max {plan.included_properties} property
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
