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
                  {plan.per_unit_price > 0
                    ? `$${plan.per_unit_price}/unit/mo`
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
                      return (
                        <td key={plan.id} className="py-3.5 px-3 text-center">
                          {included ? (
                            <span className="material-symbols-outlined text-tertiary-fixed-dim text-xl">
                              check_circle
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-outline-variant/40 text-xl">
                              remove
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
  );
}
