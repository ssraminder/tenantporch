import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { BottomTabs, type TabItem } from "@/components/layout/bottom-tabs";
import { TopBar } from "@/components/layout/top-bar";
import { PlanGateProvider } from "@/components/shared/plan-gate-provider";

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { label: "Properties", href: "/admin/properties", icon: "domain" },
  { label: "Applications", href: "/admin/applications", icon: "assignment" },
  { label: "Tenants", href: "/admin/tenants", icon: "group" },
  { label: "Financials", href: "/admin/financials", icon: "payments" },
  { label: "Utilities", href: "/admin/utilities", icon: "bolt" },
  { label: "Maintenance", href: "/admin/maintenance", icon: "handyman" },
  { label: "Documents", href: "/admin/documents", icon: "description" },
  { label: "Messages", href: "/admin/messages", icon: "mail" },
  { label: "Plan", href: "/admin/plan", icon: "workspace_premium" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

const adminTabs: TabItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "space_dashboard" },
  { label: "Properties", href: "/admin/properties", icon: "home_work" },
  { label: "Financials", href: "/admin/financials", icon: "account_balance_wallet" },
  { label: "Maintenance", href: "/admin/maintenance", icon: "build" },
  { label: "More", href: "/admin/settings", icon: "more_horiz" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id, first_name, last_name, email, avatar_url, role")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser || rpUser.role !== "landlord") redirect("/tenant/dashboard");

  // Fetch landlord profile with plan details
  const { data: landlordProfile } = await supabase
    .from("rp_landlord_profiles")
    .select(
      "id, property_count, plan_id, rp_plans(id, slug, name, base_price, included_properties, overage_rate, card_surcharge_percent, includes_all_addons, free_id_verifications_per_month)"
    )
    .eq("user_id", rpUser.id)
    .single();

  const planRaw = landlordProfile?.rp_plans;
  const plan = (Array.isArray(planRaw) ? planRaw[0] : planRaw) as any;
  const planName = plan?.name ?? null;
  const planSlug = plan?.slug ?? "free";
  const propertyCount = landlordProfile?.property_count ?? 0;

  // Fetch all plans for upgrade modal
  const { data: allPlansRaw } = await supabase
    .from("rp_plans")
    .select(
      "id, slug, name, base_price, included_properties, overage_rate, card_surcharge_percent, includes_all_addons, free_id_verifications_per_month"
    )
    .eq("is_active", true)
    .order("sort_order");

  const allPlans = (allPlansRaw ?? []).map((p) => ({
    ...p,
    base_price: Number(p.base_price),
    included_properties: Number(p.included_properties),
    overage_rate: Number(p.overage_rate),
    card_surcharge_percent: Number(p.card_surcharge_percent),
    free_id_verifications_per_month: Number(p.free_id_verifications_per_month),
  }));

  // Fetch all add-ons
  const { data: allAddonsRaw } = await supabase
    .from("rp_plan_addons")
    .select("id, slug, name, description, price, setup_fee, min_plan_slug")
    .eq("is_active", true)
    .order("sort_order");

  const allAddons = (allAddonsRaw ?? []).map((a) => ({
    ...a,
    price: Number(a.price),
    setup_fee: Number(a.setup_fee),
  }));

  // Fetch active add-ons for this landlord
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

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        items={adminNav}
        role="landlord"
        planName={planName}
        planSlug={planSlug}
        user={
          rpUser
            ? {
                firstName: rpUser.first_name,
                lastName: rpUser.last_name,
                email: rpUser.email,
                avatarUrl: rpUser.avatar_url,
              }
            : null
        }
      />
      <TopBar
        role="landlord"
        user={
          rpUser
            ? {
                firstName: rpUser.first_name,
                lastName: rpUser.last_name,
                email: rpUser.email,
                avatarUrl: rpUser.avatar_url,
              }
            : null
        }
      />
      <main className="lg:ml-64 pt-24 lg:pt-8 pb-24 lg:pb-8 px-4 md:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <PlanGateProvider
            planSlug={planSlug}
            propertyCount={propertyCount}
            plans={allPlans}
            addons={allAddons}
            activeAddonSlugs={activeAddonSlugs}
          >
            {children}
          </PlanGateProvider>
        </div>
      </main>
      <BottomTabs items={adminTabs} />
    </div>
  );
}
