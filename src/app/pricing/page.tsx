import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/navbar";
import { PricingSlider, type Plan, type PlanAddon } from "@/components/landing/pricing-slider";
import {
  PricingComparison,
  type FeatureFlag,
} from "@/components/landing/pricing-comparison";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — TenantPorch",
  description:
    "Simple, transparent pricing for Canadian property management. Compare plans, add-ons, and features.",
};

const ADDON_GROUPS: { key: string; label: string; slugs: string[] }[] = [
  { key: "payment", label: "Payment add-ons", slugs: ["pad_auto_debit", "reduced_card_surcharge", "recurring_card"] },
  { key: "feature", label: "Feature add-ons", slugs: ["compliance", "ai_assistant", "sms"] },
  { key: "pro", label: "Pro add-ons", slugs: ["api_access", "bulk_ops", "advanced_analytics"] },
];

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

export default async function PricingPage() {
  const supabase = await createClient();

  const [plansResult, featuresResult, addonsResult] = await Promise.all([
    supabase
      .from("rp_plans")
      .select(
        "id, slug, name, base_price, included_properties, overage_rate, per_unit_price, min_properties, max_properties, max_properties_hard, features, card_surcharge_percent, free_id_verifications_per_month, includes_all_addons"
      )
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("rp_feature_flags")
      .select("id, slug, name, description, category, min_plan_slug")
      .order("category")
      .order("name"),
    supabase
      .from("rp_plan_addons")
      .select("id, slug, name, description, price, setup_fee, min_plan_slug, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const plans: Plan[] = (plansResult.data ?? []).map((p) => ({
    ...p,
    base_price: Number(p.base_price),
    included_properties: Number(p.included_properties),
    overage_rate: Number(p.overage_rate),
    per_unit_price: Number(p.per_unit_price),
    card_surcharge_percent: Number(p.card_surcharge_percent),
    free_id_verifications_per_month: Number(p.free_id_verifications_per_month),
  }));

  const features: FeatureFlag[] = featuresResult.data ?? [];

  const addons: PlanAddon[] = (addonsResult.data ?? []).map((a) => ({
    ...a,
    price: Number(a.price),
    setup_fee: Number(a.setup_fee),
    category: ADDON_GROUPS.find((g) => g.slugs.includes(a.slug))?.key ?? "feature",
  }));

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="pt-16">
        {/* Plans + slider */}
        <PricingSlider plans={plans} />

        {/* Add-ons section */}
        <section className="py-16 md:py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
              Power-up with add-ons
            </h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">
              Available on all plans including Free. Pro plan includes every add-on at no extra cost.
            </p>
          </div>

          {ADDON_GROUPS.map((group) => {
            const groupAddons = addons.filter((a) => group.slugs.includes(a.slug));
            if (groupAddons.length === 0) return null;
            return (
              <div key={group.key} className="mb-10">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-8 h-px bg-secondary/30" />
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {groupAddons.map((addon) => (
                    <div
                      key={addon.id}
                      className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 flex flex-col"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className="material-symbols-outlined text-2xl text-primary bg-primary/5 p-2 rounded-lg">
                          {ADDON_ICONS[addon.slug] ?? "extension"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-on-surface">{addon.name}</h4>
                          {addon.min_plan_slug !== "free" && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                              {addon.min_plan_slug}+
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant mb-4 flex-grow">
                        {addon.description}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-primary">${addon.price}</span>
                        <span className="text-xs text-on-surface-variant">/mo</span>
                        {addon.setup_fee > 0 && (
                          <span className="text-xs text-on-surface-variant ml-auto">
                            + ${addon.setup_fee} setup
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Pay-per-use */}
        <section className="py-16 md:py-20 bg-surface-container-low px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
                Pay-per-use services
              </h2>
              <p className="text-on-surface-variant max-w-lg mx-auto">
                No subscription required. Pay only when you use them.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tenant screening */}
              <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-2xl text-primary bg-primary/5 p-2 rounded-lg">
                    verified_user
                  </span>
                  <h3 className="font-bold text-lg text-on-surface">Tenant Screening</h3>
                </div>
                <p className="text-sm text-on-surface-variant mb-4">
                  Credit check, criminal record, and eviction history via SingleKey. Results in minutes.
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-black text-primary">$40–$50</span>
                  <span className="text-sm text-on-surface-variant">/check</span>
                </div>
                <p className="text-xs text-on-surface-variant">Available on all plans. Landlord pays.</p>
              </div>

              {/* ID verification */}
              <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-2xl text-primary bg-primary/5 p-2 rounded-lg">
                    badge
                  </span>
                  <h3 className="font-bold text-lg text-on-surface">ID Verification</h3>
                </div>
                <p className="text-sm text-on-surface-variant mb-4">
                  Front + back of ID, selfie, and AI face match via Stripe Identity.
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-black text-primary">$3.99</span>
                  <span className="text-sm text-on-surface-variant">/check</span>
                </div>
                <div className="space-y-1 mt-3">
                  <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm">check_circle</span>
                    Growth: 1 free verification/month
                  </p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm">check_circle</span>
                    Pro: 2 free verifications/month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature comparison */}
        <section className="py-16 md:py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
              Compare all features
            </h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">
              Every plan includes the tenant portal, maintenance requests, and
              document storage. See what else you get as you grow.
            </p>
          </div>
          <PricingComparison plans={plans} features={features} />
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 bg-surface-container-low px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary text-center mb-8">
              Frequently asked questions
            </h2>
            {[
              {
                q: "Is the first property really free?",
                a: "Yes. Your first property is free forever — no credit card required. You only pay when you're ready to grow.",
              },
              {
                q: "How does the pricing work?",
                a: "Each paid plan has a flat base price that includes a set number of properties. If you need more, you pay a per-property overage rate. For example, Starter is $14/mo for up to 3 properties, then $5/property beyond that.",
              },
              {
                q: "What payment methods do tenants have?",
                a: "Tenants can pay via e-transfer (all plans), credit/debit card (4–6% surcharge paid by tenant), or PAD auto-debit ($10–15/transaction).",
              },
              {
                q: "Can I switch plans anytime?",
                a: "Absolutely. Upgrade or downgrade at any time. Changes take effect on your next billing cycle with prorated adjustments.",
              },
              {
                q: "What are add-ons?",
                a: "Add-ons let you purchase individual premium features without upgrading your entire plan. They're available on all plans. Pro plan includes all add-ons at no extra cost.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="bg-surface-container-lowest rounded-xl p-6 md:p-8 border border-outline-variant/10"
              >
                <h3 className="font-headline text-lg font-bold text-primary mb-2">
                  {item.q}
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
