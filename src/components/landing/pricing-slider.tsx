"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export type Plan = {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  included_properties: number;
  overage_rate: number;
  per_unit_price: number;
  min_properties: number;
  max_properties: number;
  max_properties_hard: number | null;
  features: string[];
  card_surcharge_percent: number;
  free_id_verifications_per_month: number;
  includes_all_addons: boolean;
};

export type PlanAddon = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  setup_fee: number;
  min_plan_slug: string;
  category: string;
};

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free: [
    "1 property included",
    "Tenant portal & messaging",
    "e-Transfer rent tracking",
    "Alberta lease template",
    "Maintenance requests",
    "1 e-signature per year",
  ],
  starter: [
    "3 properties included",
    "PAD auto-debit ($10/txn)",
    "Unlimited e-signatures",
    "Custom lease builder",
    "Utility bill splitting",
    "Financial reports",
  ],
  growth: [
    "10 properties included",
    "CRA T776 tax export",
    "Lease renewal workflow",
    "Contractor dispatch",
    "NOI dashboard",
    "1 free ID verification/mo",
  ],
  pro: [
    "20 properties included",
    "All add-ons included",
    "API access & webhooks",
    "Bulk operations",
    "Advanced analytics",
    "2 free ID verifications/mo",
  ],
};

function calcPlanCost(plan: Plan, count: number): number | null {
  if (plan.slug === "free" && count > (plan.max_properties_hard ?? 1)) return null;
  if (plan.slug === "enterprise") return null;
  return plan.base_price + Math.max(0, count - plan.included_properties) * plan.overage_rate;
}

function getCTA(slug: string): { label: string; href: string } {
  if (slug === "free") return { label: "Start Free", href: "/signup" };
  return { label: "Get Started", href: "/signup" };
}

export function PricingSlider({ plans }: { plans: Plan[] }) {
  const [propertyCount, setPropertyCount] = useState(1);

  const displayPlans = useMemo(
    () => plans.filter((p) => p.slug !== "enterprise"),
    [plans]
  );

  // Calculate costs and find best value
  const planCosts = useMemo(() => {
    const costs: Record<string, number | null> = {};
    for (const p of displayPlans) {
      costs[p.slug] = calcPlanCost(p, propertyCount);
    }
    return costs;
  }, [displayPlans, propertyCount]);

  const bestValueSlug = useMemo(() => {
    let cheapest: { slug: string; cost: number } | null = null;
    for (const p of displayPlans) {
      const cost = planCosts[p.slug];
      if (cost === null) continue;
      if (!cheapest || cost < cheapest.cost) {
        cheapest = { slug: p.slug, cost };
      }
    }
    return cheapest?.slug ?? null;
  }, [displayPlans, planCosts]);

  return (
    <section id="pricing" className="py-20 md:py-24 bg-surface-container-low px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
            Pricing that scales with you
          </h2>
          <p className="text-on-surface-variant max-w-lg mx-auto">
            Flat base price with included properties. Only pay overage when you grow beyond your plan.
          </p>
        </div>

        {/* Slider */}
        <div className="max-w-xl mx-auto mb-12 md:mb-16">
          <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-ambient border border-outline-variant/10">
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              How many properties do you manage?
            </label>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="range"
                min={1}
                max={50}
                value={propertyCount}
                onChange={(e) => setPropertyCount(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-secondary
                  [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-surface-container-high
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:shadow-md
                  [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-surface-container-high
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-secondary [&::-moz-range-thumb]:border-0"
              />
              <span className="text-2xl font-bold text-primary min-w-[3ch] text-right font-headline">
                {propertyCount}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
              <div>
                <p className="text-xs text-on-surface-variant">Best value</p>
                <p className="text-lg font-bold text-primary">
                  {displayPlans.find((p) => p.slug === bestValueSlug)?.name ?? "Free"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">Estimated monthly</p>
                <p className="text-2xl font-bold text-secondary font-headline">
                  {bestValueSlug
                    ? `$${(planCosts[bestValueSlug] ?? 0).toFixed(0)}`
                    : "$0"}
                </p>
                {bestValueSlug && bestValueSlug !== "free" && (
                  <p className="text-xs text-on-surface-variant">
                    {(() => {
                      const p = displayPlans.find((pp) => pp.slug === bestValueSlug);
                      if (!p) return "";
                      const overage = Math.max(0, propertyCount - p.included_properties);
                      if (overage > 0) return `$${p.base_price} base + ${overage} × $${p.overage_rate}`;
                      return `$${p.base_price} base — ${p.included_properties - propertyCount} properties headroom`;
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan cards — horizontal scroll on mobile */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {displayPlans.map((plan) => {
            const cost = planCosts[plan.slug];
            const isBestValue = plan.slug === bestValueSlug;
            const isAvailable = cost !== null;
            const highlights = PLAN_HIGHLIGHTS[plan.slug] ?? [];
            const cta = getCTA(plan.slug);
            const overage = Math.max(0, propertyCount - plan.included_properties);

            return (
              <div
                key={plan.id}
                className={`snap-center shrink-0 w-[280px] md:w-auto p-7 md:p-8 rounded-xl flex flex-col transition-all duration-300 ${
                  isBestValue
                    ? "bg-primary text-on-primary shadow-2xl shadow-primary/20 scale-[1.02] relative z-10 border-2 border-secondary"
                    : isAvailable
                      ? "bg-surface-container-lowest border border-outline-variant/10"
                      : "bg-surface-container-low border border-outline-variant/10 opacity-60"
                }`}
              >
                {isBestValue && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">
                    Best Value
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-3 ${isBestValue ? "text-on-primary" : "text-primary"}`}>
                    {plan.name}
                  </h3>

                  {/* Price display */}
                  {plan.slug === "free" ? (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black ${isBestValue ? "text-on-primary" : "text-primary"}`}>
                        $0
                      </span>
                      <span className={`text-sm ${isBestValue ? "text-inverse-primary/70" : "text-on-surface-variant"}`}>
                        /mo
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-sm font-medium ${isBestValue ? "text-inverse-primary/70" : "text-on-surface-variant"}`}>
                          $
                        </span>
                        <span className={`text-4xl font-black ${isBestValue ? "text-on-primary" : "text-primary"}`}>
                          {plan.base_price}
                        </span>
                        <span className={`text-sm ${isBestValue ? "text-inverse-primary/70" : "text-on-surface-variant"}`}>
                          /mo
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isBestValue ? "text-inverse-primary/70" : "text-on-surface-variant"}`}>
                        {plan.included_properties} properties included
                        {plan.overage_rate > 0 && ` · +$${plan.overage_rate}/extra`}
                      </p>
                    </>
                  )}

                  {/* Cost at current slider value */}
                  {isAvailable && plan.slug !== "free" && (
                    <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-semibold ${
                      isBestValue ? "bg-white/10" : "bg-surface-container-low"
                    }`}>
                      <span className={isBestValue ? "text-secondary-fixed" : "text-secondary"}>
                        ${cost?.toFixed(0)}
                      </span>
                      <span className={`text-xs font-normal ml-1 ${isBestValue ? "text-inverse-primary/70" : "text-on-surface-variant"}`}>
                        /mo for {propertyCount} {propertyCount === 1 ? "property" : "properties"}
                        {overage > 0 && ` (${overage} overage)`}
                      </span>
                    </div>
                  )}

                  {!isAvailable && (
                    <p className="mt-3 text-xs text-on-surface-variant">
                      Limited to {plan.max_properties_hard ?? 1} property
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {highlights.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2.5 text-sm ${isBestValue ? "text-on-primary" : "text-on-surface"}`}
                    >
                      <span className={`material-symbols-outlined text-base mt-0.5 ${isBestValue ? "text-secondary-fixed" : "text-tertiary-fixed-dim"}`}>
                        check_circle
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={cta.href}
                  className={`block w-full py-3 text-center font-bold rounded-lg transition-all ${
                    isBestValue
                      ? "bg-secondary text-on-secondary hover:opacity-90"
                      : isAvailable
                        ? "border border-primary text-primary hover:bg-primary/5"
                        : "border border-outline-variant text-outline cursor-not-allowed pointer-events-none"
                  }`}
                >
                  {isAvailable ? cta.label : "Unavailable"}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Enterprise banner */}
        <div className="mt-8 md:mt-10 bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold text-primary mb-1">
              50+ properties?
            </h3>
            <p className="text-on-surface-variant">
              Custom volume pricing, dedicated support, and white-label options for property managers.
            </p>
          </div>
          <a
            href="mailto:hello@tenantporch.com"
            className="shrink-0 px-8 py-3 border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
