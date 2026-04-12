import { createClient } from "@/lib/supabase/server";
import {
  ProfileSection,
  NotificationPreferencesSection,
  CurrencyTimezoneSection,
  StripeConnectSection,
  DangerZoneSection,
} from "./settings-forms";
import { SubscriptionSection } from "./subscription-section";

export default async function AdminSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select(
      "id, first_name, last_name, email, phone, notification_email, notification_sms, notification_push, timezone, preferred_currency"
    )
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // ─── Fetch landlord profile with plan ───
  const { data: landlordProfile } = await supabase
    .from("rp_landlord_profiles")
    .select(
      "id, company_name, business_number, currency_code, property_count, subscription_status, trial_ends_at, current_period_start, current_period_end, stripe_connect_account_id, stripe_customer_id, plan_id, rp_plans(id, slug, name, base_price, included_properties, overage_rate, card_surcharge_percent, includes_all_addons, free_id_verifications_per_month)"
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

  const stripeConnected = !!landlordProfile?.stripe_connect_account_id;
  const stripeAccountPreview = landlordProfile?.stripe_connect_account_id
    ? `${landlordProfile.stripe_connect_account_id.substring(0, 12)}...`
    : null;

  // ─── Fetch all add-ons + active add-ons ───
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
      .map((a) => (a.rp_plan_addons as any)?.slug)
      .filter(Boolean);
  }

  const addonsForDisplay = (allAddonsRaw ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    price: Number(a.price),
    setup_fee: Number(a.setup_fee),
    min_plan_slug: a.min_plan_slug,
    active: activeAddonSlugs.includes(a.slug),
  }));

  return (
    <section className="space-y-8">
      {/* ─── Header ─── */}
      <h1 className="font-headline text-2xl font-bold text-primary">
        Settings
      </h1>

      {/* ─── Profile Section ─── */}
      <ProfileSection
        user={{
          firstName: rpUser.first_name,
          lastName: rpUser.last_name,
          email: rpUser.email,
          phone: rpUser.phone ?? undefined,
        }}
        landlordProfile={landlordProfile}
      />

      {/* ─── Subscription & Plan Section ─── */}
      <SubscriptionSection
        planName={plan?.name ?? "Free"}
        planSlug={plan?.slug ?? "free"}
        basePrice={Number(plan?.base_price ?? 0)}
        includedProperties={Number(plan?.included_properties ?? 1)}
        overageRate={Number(plan?.overage_rate ?? 0)}
        propertyCount={landlordProfile?.property_count ?? 0}
        cardSurcharge={Number(plan?.card_surcharge_percent ?? 4)}
        includesAllAddons={plan?.includes_all_addons ?? false}
        freeIdVerifications={Number(plan?.free_id_verifications_per_month ?? 0)}
        subscriptionStatus={landlordProfile?.subscription_status ?? "free"}
        addons={addonsForDisplay}
        stripeCustomerId={landlordProfile?.stripe_customer_id ?? null}
      />

      {/* ─── Stripe Connect Section ─── */}
      <StripeConnectSection
        stripeConnected={stripeConnected}
        stripeAccountPreview={stripeAccountPreview}
      />

      {/* ─── Notification Preferences ─── */}
      <NotificationPreferencesSection
        initialEmail={!!rpUser.notification_email}
        initialSms={!!rpUser.notification_sms}
        initialPush={!!rpUser.notification_push}
      />

      {/* ─── Currency & Timezone ─── */}
      <CurrencyTimezoneSection
        initialCurrency={rpUser.preferred_currency ?? landlordProfile?.currency_code ?? "CAD"}
        initialTimezone={rpUser.timezone ?? "America/Edmonton"}
      />

      {/* ─── Danger Zone ─── */}
      <DangerZoneSection />
    </section>
  );
}
