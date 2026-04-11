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
      "id, slug, name, per_unit_price, min_properties, max_properties, features, card_surcharge_percent"
    )
    .eq("is_active", true)
    .order("sort_order");

  const plans: Plan[] = (plansRaw ?? []).map((p) => ({
    ...p,
    per_unit_price: Number(p.per_unit_price),
    card_surcharge_percent: Number(p.card_surcharge_percent),
  }));

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="pt-16">
        <Hero />

        {/* Social proof */}
        <section className="py-10 md:py-12 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-on-surface-variant font-medium mb-6 md:mb-8 text-sm">
              Trusted by 200+ Canadian landlords across the provinces
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-40 grayscale">
              {["METROBASE", "MAPLEHOUSING", "CDNPROPS", "LAKEVIEW MGMT"].map(
                (name) => (
                  <div
                    key={name}
                    className="text-lg md:text-2xl font-black italic tracking-tighter text-on-surface"
                  >
                    {name}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <Features />

        <PricingSlider plans={plans} />

        <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
