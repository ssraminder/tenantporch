import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { PricingSlider, type Plan } from "@/components/landing/pricing-slider";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/landing/footer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to their dashboard
  if (user) {
    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (rpUser?.role === "landlord") redirect("/admin/dashboard");
    if (rpUser) redirect("/tenant/dashboard");
  }

  // Fetch plans for pricing section
  const { data: plansRaw } = await supabase
    .from("rp_plans")
    .select(
      "id, slug, name, base_price, included_properties, overage_rate, per_unit_price, min_properties, max_properties, max_properties_hard, features, card_surcharge_percent, free_id_verifications_per_month, includes_all_addons"
    )
    .eq("is_active", true)
    .order("sort_order");

  const plans: Plan[] = (plansRaw ?? []).map((p) => ({
    ...p,
    base_price: Number(p.base_price),
    included_properties: Number(p.included_properties),
    overage_rate: Number(p.overage_rate),
    per_unit_price: Number(p.per_unit_price),
    card_surcharge_percent: Number(p.card_surcharge_percent),
    free_id_verifications_per_month: Number(p.free_id_verifications_per_month),
  }));

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="pt-16">
        <Hero />

        <Features />

        <PricingSlider plans={plans} />

        <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
