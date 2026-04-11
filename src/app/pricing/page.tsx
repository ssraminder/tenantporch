import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/navbar";
import { PricingSlider, type Plan } from "@/components/landing/pricing-slider";
import {
  PricingComparison,
  type FeatureFlag,
} from "@/components/landing/pricing-comparison";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — TenantPorch",
  description:
    "Simple, transparent per-unit pricing for Canadian property management. Compare plans and features.",
};

export default async function PricingPage() {
  const supabase = await createClient();

  const [plansResult, featuresResult] = await Promise.all([
    supabase
      .from("rp_plans")
      .select(
        "id, slug, name, per_unit_price, min_properties, max_properties, features, card_surcharge_percent"
      )
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("rp_feature_flags")
      .select("id, slug, name, description, category, min_plan_slug")
      .order("category")
      .order("name"),
  ]);

  const plans: Plan[] = (plansResult.data ?? []).map((p) => ({
    ...p,
    per_unit_price: Number(p.per_unit_price),
    card_surcharge_percent: Number(p.card_surcharge_percent),
  }));

  const features: FeatureFlag[] = featuresResult.data ?? [];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="pt-16">
        <PricingSlider plans={plans} />

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

        {/* FAQ-style callouts */}
        <section className="py-16 md:py-20 bg-surface-container-low px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary text-center mb-8">
              Frequently asked questions
            </h2>

            {[
              {
                q: "Is the first property really free?",
                a: "Yes. Your first property is free forever — no credit card required. You only pay when you add a second property.",
              },
              {
                q: "How does per-unit pricing work?",
                a: "You're billed based on the number of rental units you manage. The per-unit rate decreases as your portfolio grows, rewarding scale.",
              },
              {
                q: "What payment methods do tenants have?",
                a: "Tenants can pay via e-transfer (tracked manually) on all plans, or by credit/debit card (via Stripe Connect) on paid plans.",
              },
              {
                q: "Can I switch plans anytime?",
                a: "Absolutely. Upgrade or downgrade at any time. Changes take effect on your next billing cycle with prorated adjustments.",
              },
              {
                q: "Is my data province-compliant?",
                a: "Yes. TenantPorch is built for Canadian landlords with province-specific lease templates and compliance tools for Ontario, BC, and Alberta.",
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
