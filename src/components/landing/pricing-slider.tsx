"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export type Plan = {
  id: string;
  slug: string;
  name: string;
  per_unit_price: number;
  min_properties: number;
  max_properties: number;
  features: string[];
  card_surcharge_percent: number;
};

const FEATURE_LABELS: Record<string, string> = {
  tenant_portal: "Tenant Portal",
  etransfer_tracking: "E-Transfer Tracking",
  ab_lease_template: "Alberta Lease Template",
  document_storage: "Document Storage",
  maintenance_requests: "Maintenance Requests",
  rent_reminders: "Rent Reminders",
  late_fee_tracking: "Late Fee Tracking",
  inspections: "Inspections",
  inventory_tracking: "Inventory Tracking",
  card_payments: "Card Payments (Stripe)",
  utility_splitting: "Utility Bill Splitting",
  financial_reports: "Financial Reports",
  multi_property_dashboard: "Multi-Property Dashboard",
  lease_builder: "Custom Lease Builder",
  esigning: "E-Signing",
  t776_export: "CRA T776 Export",
  sms_notifications: "SMS Notifications",
  tenant_screening: "Tenant Screening",
  rent_guarantee: "Rent Guarantee",
  listing_syndication: "Listing Syndication",
  api_access: "API Access",
  bulk_operations: "Bulk Operations",
  advanced_analytics: "Advanced Analytics",
  priority_support: "Priority Support",
};

function getPlanHighlights(slug: string): string[] {
  switch (slug) {
    case "free":
      return [
        "Essential Rent Tracking",
        "Document Storage (1 GB)",
        "Maintenance Requests",
      ];
    case "starter":
      return [
        "Everything in Free",
        "Card Payments (Stripe)",
        "Custom Lease Builder",
        "Financial Reports",
      ];
    case "growth":
      return [
        "Everything in Starter",
        "Tenant Screening",
        "CRA T776 Export",
        "SMS Notifications",
      ];
    case "pro":
      return [
        "Everything in Growth",
        "API Access",
        "Advanced Analytics",
        "Priority Support",
      ];
    case "enterprise":
      return [
        "Everything in Pro",
        "Custom Integrations",
        "Dedicated Account Manager",
        "White-Label Options",
      ];
    default:
      return [];
  }
}

function getPlanCTA(slug: string): { label: string; href: string } {
  switch (slug) {
    case "free":
      return { label: "Start Free", href: "/signup" };
    case "enterprise":
      return { label: "Contact Sales", href: "#" };
    default:
      return { label: "Get Started", href: "/signup" };
  }
}

export function PricingSlider({ plans }: { plans: Plan[] }) {
  const [propertyCount, setPropertyCount] = useState(1);

  const displayPlans = useMemo(
    () => plans.filter((p) => p.slug !== "enterprise"),
    [plans]
  );

  const enterprisePlan = plans.find((p) => p.slug === "enterprise");

  const matchingPlan = useMemo(() => {
    return (
      plans.find(
        (p) =>
          propertyCount >= p.min_properties &&
          propertyCount <= p.max_properties
      ) ?? plans[0]
    );
  }, [plans, propertyCount]);

  const monthlyTotal = matchingPlan.per_unit_price * propertyCount;

  return (
    <section id="pricing" className="py-20 md:py-24 bg-surface-container-low px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
            Pricing that scales with you
          </h2>
          <p className="text-on-surface-variant max-w-md mx-auto">
            Simple, transparent per-unit pricing. Your first property is always
            free.
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
                <p className="text-xs text-on-surface-variant">
                  Recommended plan
                </p>
                <p className="text-lg font-bold text-primary">
                  {matchingPlan.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">
                  Estimated monthly
                </p>
                <p className="text-2xl font-bold text-secondary font-headline">
                  {matchingPlan.slug === "enterprise"
                    ? "Custom"
                    : formatCurrency(monthlyTotal)}
                </p>
                {matchingPlan.per_unit_price > 0 && (
                  <p className="text-xs text-on-surface-variant">
                    {formatCurrency(matchingPlan.per_unit_price)}/unit/mo
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayPlans.map((plan) => {
            const isMatch = plan.slug === matchingPlan.slug;
            const highlights = getPlanHighlights(plan.slug);
            const cta = getPlanCTA(plan.slug);

            return (
              <div
                key={plan.id}
                className={`p-7 md:p-8 rounded-xl flex flex-col transition-all duration-300 ${
                  isMatch
                    ? "bg-primary text-on-primary shadow-2xl shadow-primary/20 scale-[1.02] relative z-10 border-2 border-secondary"
                    : "bg-surface-container-lowest border border-outline-variant/10"
                }`}
              >
                {isMatch && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                    Recommended
                  </div>
                )}

                <div className="mb-6 md:mb-8">
                  <h3
                    className={`text-xl font-bold mb-2 ${isMatch ? "text-on-primary" : "text-primary"}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-sm font-medium ${isMatch ? "text-inverse-primary/70" : "text-on-surface-variant"}`}
                    >
                      CAD $
                    </span>
                    <span
                      className={`text-4xl font-black ${isMatch ? "text-on-primary" : "text-primary"}`}
                    >
                      {plan.per_unit_price}
                    </span>
                    {plan.per_unit_price > 0 && (
                      <span
                        className={`text-sm ${isMatch ? "text-inverse-primary/70" : "text-on-surface-variant"}`}
                      >
                        /unit/mo
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-2 ${isMatch ? "text-inverse-primary/70" : "text-on-surface-variant"}`}
                  >
                    {plan.slug === "free"
                      ? "1 property"
                      : `${plan.min_properties}–${plan.max_properties} properties`}
                  </p>
                </div>

                <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-grow">
                  {highlights.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-center gap-3 text-sm ${isMatch ? "text-on-primary" : "text-on-surface"}`}
                    >
                      <span
                        className={`material-symbols-outlined text-lg ${isMatch ? "text-secondary-fixed" : "text-tertiary-fixed-dim"}`}
                      >
                        check_circle
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={cta.href}
                  className={`block w-full py-3 text-center font-bold rounded-lg transition-all ${
                    isMatch
                      ? "bg-secondary text-on-secondary hover:opacity-90"
                      : "border border-primary text-primary hover:bg-primary/5"
                  }`}
                >
                  {cta.label}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Enterprise banner */}
        {enterprisePlan && (
          <div className="mt-8 md:mt-10 bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <h3 className="text-xl font-bold text-primary mb-1">
                Enterprise
              </h3>
              <p className="text-on-surface-variant">
                50+ units? Get custom volume pricing, dedicated support, and
                white-label options.
              </p>
            </div>
            <a
              href="#"
              className="shrink-0 px-8 py-3 border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
