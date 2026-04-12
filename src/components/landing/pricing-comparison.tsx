"use client";

import type { Plan } from "./pricing-slider";

export type FeatureFlag = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  min_plan_slug: string;
};

const PLAN_ORDER = ["free", "starter", "growth", "pro", "enterprise"];

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  payments: "Payments",
  compliance: "Compliance",
  communication: "Communication",
  reporting: "Reporting",
  integration: "Integrations",
  ai: "AI & Automation",
};

// Map feature flag slugs to their add-on price when not included in plan
const FEATURE_ADDON_PRICE: Record<string, number> = {
  sms_notifications: 3,
  ai_lease_assistant: 5,
  api_access: 10,
  bulk_operations: 8,
  advanced_analytics: 8,
  t776_export: 5,
  card_payments: 3,
};

function planIncludesFeature(plan: Plan, featureMinPlan: string): boolean {
  if (plan.slug === "enterprise") return true;
  const planIdx = PLAN_ORDER.indexOf(plan.slug);
  const minIdx = PLAN_ORDER.indexOf(featureMinPlan);
  return planIdx >= minIdx;
}

export function PricingComparison({
  plans,
  features,
}: {
  plans: Plan[];
  features: FeatureFlag[];
}) {
  const displayPlans = plans.filter((p) => p.slug !== "enterprise");
  const categories = Array.from(new Set(features.map((f) => f.category)));

  return (
    <div>
      <p className="text-xs text-on-surface-variant mb-3 flex items-center gap-1.5 md:hidden">
        <span className="material-symbols-outlined text-sm">swipe</span>
        Swipe to compare plans
      </p>
      <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr>
            <th className="text-left py-4 pr-4 text-sm font-bold text-primary sticky left-0 bg-surface z-10 min-w-[200px]">
              Feature
            </th>
            {displayPlans.map((plan) => (
              <th
                key={plan.id}
                className="py-4 px-3 text-center text-sm font-bold text-primary min-w-[120px]"
              >
                <div>{plan.name}</div>
                <div className="text-xs font-medium text-on-surface-variant mt-1">
                  {plan.base_price > 0
                    ? `$${plan.base_price}/mo`
                    : "Free"}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        {categories.map((category) => {
          const categoryFeatures = features.filter(
            (f) => f.category === category
          );
          if (categoryFeatures.length === 0) return null;

          return (
            <tbody key={category}>
              <tr>
                <td
                  colSpan={displayPlans.length + 1}
                  className="pt-8 pb-3 text-xs font-bold text-secondary uppercase tracking-widest sticky left-0 bg-surface z-10"
                >
                  {CATEGORY_LABELS[category] ?? category}
                </td>
              </tr>
              {categoryFeatures.map((feature) => (
                <tr
                  key={feature.id}
                  className="border-t border-outline-variant/10"
                >
                  <td className="py-3.5 pr-4 sticky left-0 bg-surface z-10">
                    <p className="text-sm text-on-surface font-medium">
                      {feature.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {feature.description}
                    </p>
                  </td>
                  {displayPlans.map((plan) => {
                    const included = planIncludesFeature(
                      plan,
                      feature.min_plan_slug
                    );
                    const addonPrice = FEATURE_ADDON_PRICE[feature.slug];
                    return (
                      <td key={plan.id} className="py-3.5 px-3 text-center">
                        {included ? (
                          <span className="material-symbols-outlined text-tertiary-fixed-dim text-xl">
                            check_circle
                          </span>
                        ) : addonPrice ? (
                          <span className="text-xs font-semibold text-secondary whitespace-nowrap">
                            +${addonPrice}/mo
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
                            {feature.min_plan_slug
                              ? `${feature.min_plan_slug}+`
                              : "—"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
      </div>
    </div>
  );
}
