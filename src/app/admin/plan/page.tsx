import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlanServices } from "./plan-services";
import { FEATURE_GATES, isFeatureAvailable } from "@/lib/feature-gates";

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser) redirect("/login");

  // Fetch landlord profile with plan
  const { data: landlordProfile } = await supabase
    .from("rp_landlord_profiles")
    .select(
      "id, property_count, subscription_status, plan_id, stripe_customer_id, rp_plans(id, slug, name, base_price, included_properties, overage_rate, card_surcharge_percent, includes_all_addons, free_id_verifications_per_month)"
    )
    .eq("user_id", rpUser.id)
    .single();

  const planRaw = landlordProfile?.rp_plans;
  const plan = (Array.isArray(planRaw) ? planRaw[0] : planRaw) as {
    id: string;
    slug: string;
    name: string;
    base_price: number;
    included_properties: number;
    overage_rate: number;
    card_surcharge_percent: number;
    includes_all_addons: boolean;
    free_id_verifications_per_month: number;
  } | null;

  const planSlug = plan?.slug ?? "free";

  // Fetch all add-ons + active add-ons
  const { data: allAddonsRaw } = await supabase
    .from("rp_plan_addons")
    .select("id, slug, name, description, price, setup_fee, min_plan_slug")
    .eq("is_active", true)
    .order("sort_order");

  let activeAddonSlugs: string[] = [];
  if (landlordProfile) {
    const { data: activeAddons } = await supabase
      .from("rp_landlord_addons")
      .select("addon_id, rp_plan_addons(slug)")
      .eq("landlord_profile_id", landlordProfile.id)
      .eq("status", "active");
    activeAddonSlugs = (activeAddons ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a) => (a.rp_plan_addons as any)?.slug)
      .filter(Boolean);
  }

  // Build feature list with availability status
  const features = Object.entries(FEATURE_GATES).map(([key, gate]) => ({
    key,
    name: gate.name,
    description: gate.description,
    benefits: gate.benefits,
    minPlanSlug: gate.minPlanSlug,
    addonSlug: gate.addonSlug,
    addonName: gate.addonName,
    addonPrice: gate.addonPrice,
    included: isFeatureAvailable(key, planSlug, activeAddonSlugs),
    activeViaAddon: gate.addonSlug
      ? activeAddonSlugs.includes(gate.addonSlug)
      : false,
  }));

  const addons = (allAddonsRaw ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    price: Number(a.price),
    setup_fee: Number(a.setup_fee),
    min_plan_slug: a.min_plan_slug,
    active: activeAddonSlugs.includes(a.slug),
  }));

  const propertyCount = landlordProfile?.property_count ?? 0;
  const overage = Math.max(
    0,
    propertyCount - Number(plan?.included_properties ?? 1)
  );
  const monthlyCost =
    Number(plan?.base_price ?? 0) + overage * Number(plan?.overage_rate ?? 0);

  return (
    <section className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-primary">
        Plan & Services
      </h1>
      <PlanServices
        planName={plan?.name ?? "Free"}
        planSlug={planSlug}
        monthlyCost={monthlyCost}
        includedProperties={Number(plan?.included_properties ?? 1)}
        propertyCount={propertyCount}
        overageRate={Number(plan?.overage_rate ?? 0)}
        freeIdVerifications={Number(
          plan?.free_id_verifications_per_month ?? 0
        )}
        includesAllAddons={plan?.includes_all_addons ?? false}
        subscriptionStatus={landlordProfile?.subscription_status ?? "free"}
        features={features}
        addons={addons}
        hasStripeCustomer={!!landlordProfile?.stripe_customer_id}
      />
    </section>
  );
}
