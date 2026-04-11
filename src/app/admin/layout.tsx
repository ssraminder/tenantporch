import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { BottomTabs, type TabItem } from "@/components/layout/bottom-tabs";
import { TopBar } from "@/components/layout/top-bar";

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { label: "Properties", href: "/admin/properties", icon: "domain" },
  { label: "Financials", href: "/admin/financials", icon: "payments" },
  { label: "Maintenance", href: "/admin/maintenance", icon: "handyman" },
  { label: "Documents", href: "/admin/documents", icon: "description" },
  { label: "Messages", href: "/admin/messages", icon: "mail" },
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
    .select("first_name, last_name, email, avatar_url, role")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser || rpUser.role !== "landlord") redirect("/tenant/dashboard");

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar items={adminNav} role="landlord" />
      <TopBar
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
      <main className="lg:ml-64 pt-24 pb-24 lg:pb-8 px-4 md:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
      <BottomTabs items={adminTabs} />
    </div>
  );
}
