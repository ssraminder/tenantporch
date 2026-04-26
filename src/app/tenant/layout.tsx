import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { BottomTabs, type TabItem } from "@/components/layout/bottom-tabs";
import { TopBar } from "@/components/layout/top-bar";

const tenantNav: NavItem[] = [
  { label: "Dashboard", href: "/tenant/dashboard", icon: "space_dashboard" },
  { label: "Lease", href: "/tenant/lease", icon: "description" },
  { label: "Payments", href: "/tenant/payments", icon: "account_balance_wallet" },
  { label: "Maintenance", href: "/tenant/maintenance", icon: "handyman" },
  { label: "Documents", href: "/tenant/documents", icon: "folder" },
  { label: "Messages", href: "/tenant/messages", icon: "mail" },
  { label: "Profile", href: "/tenant/profile", icon: "person" },
];

const tenantTabs: TabItem[] = [
  { label: "Dashboard", href: "/tenant/dashboard", icon: "space_dashboard" },
  { label: "Payments", href: "/tenant/payments", icon: "account_balance_wallet" },
  { label: "Maintenance", href: "/tenant/maintenance", icon: "build" },
  { label: "Documents", href: "/tenant/documents", icon: "description" },
  { label: "More", href: "/tenant/profile", icon: "more_horiz" },
];

export default async function TenantLayout({
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
    .select("id, first_name, last_name, email, avatar_url, role, must_change_password")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser || rpUser.role === "landlord") redirect("/admin/dashboard");

  // Force password change for auto-created accounts
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  if (rpUser.must_change_password && !pathname.includes("/change-password")) {
    redirect("/tenant/change-password");
  }

  // Fetch tenant's property address for sidebar
  let propertyAddress: string | null = null;
  const { data: leaseLink } = await supabase
    .from("rp_lease_tenants")
    .select("rp_leases!inner(rp_properties!inner(address_line1, city))")
    .eq("user_id", rpUser.id)
    .limit(1)
    .single();

  if (leaseLink) {
    const props = (leaseLink as any).rp_leases?.rp_properties;
    if (props) {
      propertyAddress = `${props.address_line1}, ${props.city}`;
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        items={tenantNav}
        role="tenant"
        propertyAddress={propertyAddress}
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
        role="tenant"
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
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
      <BottomTabs items={tenantTabs} />
    </div>
  );
}
