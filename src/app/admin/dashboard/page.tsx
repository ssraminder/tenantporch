import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";

const NOTIF_ICON: Record<string, { icon: string; color: string }> = {
  rent_due: { icon: "payments", color: "bg-secondary" },
  rent_overdue: { icon: "warning", color: "bg-error" },
  payment_received: { icon: "check_circle", color: "bg-tertiary" },
  maintenance_update: { icon: "handyman", color: "bg-secondary" },
  document_uploaded: { icon: "description", color: "bg-primary" },
  notice: { icon: "gavel", color: "bg-primary" },
  utility_bill: { icon: "receipt_long", color: "bg-secondary" },
  general: { icon: "info", color: "bg-outline" },
  screening_complete: { icon: "verified", color: "bg-tertiary" },
};

const URGENCY_STYLES: Record<string, string> = {
  low: "bg-primary-fixed/30 text-on-primary-fixed-variant",
  medium: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  high: "bg-error-container text-on-error-container",
  emergency: "bg-error text-on-error",
};

const METHOD_LABELS: Record<string, { label: string; icon: string }> = {
  card: { label: "Card", icon: "credit_card" },
  bank_transfer: { label: "Bank", icon: "account_balance" },
  e_transfer: { label: "e-Transfer", icon: "swap_horiz" },
  cash: { label: "Cash", icon: "payments" },
  cheque: { label: "Cheque", icon: "receipt" },
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─── Fetch landlord profile ───
  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id, first_name, last_name, email")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  const { data: landlordProfile } = await supabase
    .from("rp_landlord_profiles")
    .select("company_name, subscription_status, plan_id, rp_plans(name)")
    .eq("user_id", rpUser.id)
    .single();

  const companyName = landlordProfile?.company_name ?? null;
  const subscriptionStatus = landlordProfile?.subscription_status ?? "inactive";
  const planName =
    (landlordProfile?.rp_plans as any)?.name ?? "No plan";

  // ─── Fetch properties ───
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyCount = propertyIds.length;

  // ─── Active Leases count ───
  let activeLeaseCount = 0;
  if (propertyIds.length > 0) {
    const { count } = await supabase
      .from("rp_leases")
      .select("id", { count: "exact", head: true })
      .in("property_id", propertyIds)
      .eq("status", "active");
    activeLeaseCount = count ?? 0;
  }

  // ─── Revenue This Month ───
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  let revenueThisMonth = 0;
  if (propertyIds.length > 0) {
    // Get lease IDs for this landlord's properties
    const { data: leases } = await supabase
      .from("rp_leases")
      .select("id")
      .in("property_id", propertyIds);

    const leaseIds = (leases ?? []).map((l) => l.id);

    if (leaseIds.length > 0) {
      const { data: confirmedPayments } = await supabase
        .from("rp_payments")
        .select("amount")
        .in("lease_id", leaseIds)
        .eq("status", "confirmed")
        .gte("created_at", `${monthStart}T00:00:00`)
        .lte("created_at", `${monthEnd}T23:59:59`);

      revenueThisMonth = (confirmedPayments ?? []).reduce(
        (sum, p) => sum + Number(p.amount ?? 0),
        0
      );
    }
  }

  // ─── Open Maintenance Requests count ───
  let openMaintenanceCount = 0;
  if (propertyIds.length > 0) {
    const { count } = await supabase
      .from("rp_maintenance_requests")
      .select("id", { count: "exact", head: true })
      .in("property_id", propertyIds)
      .not("status", "in", '("completed","cancelled")');
    openMaintenanceCount = count ?? 0;
  }

  // ─── Rent Collection Summary (current month) ───
  let totalDue = 0;
  let totalCollected = 0;
  let overdueCount = 0;
  if (propertyIds.length > 0) {
    const { data: leases } = await supabase
      .from("rp_leases")
      .select("id")
      .in("property_id", propertyIds);

    const leaseIds = (leases ?? []).map((l) => l.id);

    if (leaseIds.length > 0) {
      const { data: rentScheduleRows } = await supabase
        .from("rp_rent_schedule")
        .select("amount_due, amount_paid, status")
        .in("lease_id", leaseIds)
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd);

      for (const row of rentScheduleRows ?? []) {
        totalDue += Number(row.amount_due ?? 0);
        totalCollected += Number(row.amount_paid ?? 0);
        if (row.status === "overdue") overdueCount++;
      }
    }
  }

  const collectionPercent =
    totalDue > 0 ? Math.min(100, Math.round((totalCollected / totalDue) * 100)) : 0;

  // ─── Recent Payments (last 5) ───
  let recentPayments: any[] = [];
  if (propertyIds.length > 0) {
    const { data: leases } = await supabase
      .from("rp_leases")
      .select("id")
      .in("property_id", propertyIds);

    const leaseIds = (leases ?? []).map((l) => l.id);

    if (leaseIds.length > 0) {
      const { data: payments } = await supabase
        .from("rp_payments")
        .select(
          "id, amount, status, payment_method, created_at, currency_code, rp_users!rp_payments_tenant_id_fkey(first_name, last_name)"
        )
        .in("lease_id", leaseIds)
        .order("created_at", { ascending: false })
        .limit(5);

      recentPayments = payments ?? [];
    }
  }

  // ─── Open Maintenance Requests (last 5) ───
  let maintenanceRequests: any[] = [];
  if (propertyIds.length > 0) {
    const { data: requests } = await supabase
      .from("rp_maintenance_requests")
      .select(
        "id, title, urgency, status, created_at, rp_properties(address_line1)"
      )
      .in("property_id", propertyIds)
      .not("status", "in", '("completed","cancelled")')
      .order("created_at", { ascending: false })
      .limit(5);

    maintenanceRequests = requests ?? [];
  }

  // ─── Recent Notifications (last 5) ───
  const { data: notifications } = await supabase
    .from("rp_notifications")
    .select("*")
    .eq("user_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // ─── Stats data ───
  const stats = [
    {
      label: "Properties",
      value: propertyCount.toString(),
      icon: "domain",
      href: "/admin/properties",
    },
    {
      label: "Active Leases",
      value: activeLeaseCount.toString(),
      icon: "gavel",
      href: "/admin/properties",
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(revenueThisMonth, "CAD"),
      icon: "payments",
      href: "/admin/financials",
    },
    {
      label: "Open Requests",
      value: openMaintenanceCount.toString(),
      icon: "handyman",
      href: "/admin/maintenance",
    },
  ];

  return (
    <section className="space-y-8">
      {/* ─── Welcome Hero ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-8 md:p-10 flex flex-col justify-end min-h-[200px] shadow-ambient-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary opacity-80" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/30 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge status={subscriptionStatus} />
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-fixed/20 text-secondary-fixed-dim">
              {planName}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline mb-2">
            Welcome back, {rpUser.first_name ?? "Landlord"}
          </h2>
          <p className="text-inverse-primary/80 text-base md:text-lg">
            {companyName
              ? companyName
              : "Here\u2019s your property overview."}
          </p>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient-sm hover:bg-surface-container-low transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                {stat.icon}
              </span>
              <span className="material-symbols-outlined text-outline-variant text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                arrow_forward
              </span>
            </div>
            <p className="text-2xl font-extrabold text-primary font-headline">
              {stat.value}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* ─── Rent Collection Summary ─── */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              account_balance_wallet
            </span>
            <h3 className="font-headline font-bold text-xl">
              Rent Collection
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">
              {now.toLocaleDateString("en-CA", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-error-container">
              <span className="material-symbols-outlined text-on-error-container text-sm">
                warning
              </span>
              <span className="text-xs font-bold text-on-error-container">
                {overdueCount} overdue
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Total Due
            </p>
            <p className="text-2xl font-extrabold font-headline text-primary">
              {formatCurrency(totalDue, "CAD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Collected
            </p>
            <p className="text-2xl font-extrabold font-headline text-tertiary">
              {formatCurrency(totalCollected, "CAD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Outstanding
            </p>
            <p className="text-2xl font-extrabold font-headline text-secondary">
              {formatCurrency(Math.max(0, totalDue - totalCollected), "CAD")}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="flex mb-2 items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">
              {collectionPercent}% collected
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">
              {formatCurrency(totalCollected, "CAD")} /{" "}
              {formatCurrency(totalDue, "CAD")}
            </span>
          </div>
          <div className="overflow-hidden h-3 rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-gradient-to-r from-tertiary to-tertiary-container transition-all duration-500"
              style={{ width: `${collectionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Recent Payments + Maintenance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Payments */}
        <div className="lg:col-span-7 bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
          <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                receipt_long
              </span>
              <h3 className="font-headline font-bold text-lg">
                Recent Payments
              </h3>
            </div>
            <Link
              href="/admin/financials"
              className="text-xs font-bold text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
                payments
              </span>
              <p className="text-sm text-on-surface-variant">
                No payments yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                    <th className="px-6 md:px-8 py-3">Date</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 pr-6 md:pr-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentPayments.map((payment) => {
                    const tenant = payment.rp_users as any;
                    const tenantName = tenant
                      ? `${tenant.first_name} ${tenant.last_name}`
                      : "Unknown";
                    const method =
                      METHOD_LABELS[payment.payment_method] ??
                      METHOD_LABELS.card;
                    return (
                      <tr
                        key={payment.id}
                        className="hover:bg-surface-container-low transition-colors"
                      >
                        <td className="px-6 md:px-8 py-4 text-sm text-on-surface">
                          <DateDisplay
                            date={payment.created_at}
                            format="short"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-primary">
                          {tenantName}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-on-surface">
                          {formatCurrency(
                            Number(payment.amount ?? 0),
                            payment.currency_code ?? "CAD"
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">
                              {method.icon}
                            </span>
                            {method.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 pr-6 md:pr-8">
                          <StatusBadge status={payment.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Open Maintenance Requests */}
        <div className="lg:col-span-5 bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
          <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                handyman
              </span>
              <h3 className="font-headline font-bold text-lg">
                Open Requests
              </h3>
            </div>
            <Link
              href="/admin/maintenance"
              className="text-xs font-bold text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          {maintenanceRequests.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
                check_circle
              </span>
              <p className="text-sm text-on-surface-variant">
                No open requests
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {maintenanceRequests.map((req) => {
                const propAddress =
                  (req.rp_properties as any)?.address_line1 ?? "Unknown";
                const urgencyStyle =
                  URGENCY_STYLES[req.urgency] ?? URGENCY_STYLES.low;
                return (
                  <Link
                    key={req.id}
                    href="/admin/maintenance"
                    className="flex items-start gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">
                        {req.title}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          location_on
                        </span>
                        {propAddress}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgencyStyle}`}
                        >
                          {req.urgency}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                    <span className="text-xs text-on-surface-variant whitespace-nowrap pt-0.5">
                      <DateDisplay date={req.created_at} format="relative" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Activity Feed ─── */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              notifications
            </span>
            <h3 className="font-headline font-bold text-lg">
              Activity Feed
            </h3>
          </div>
          <Link
            href="/admin/messages"
            className="text-xs font-bold text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {(notifications ?? []).length === 0 && (
            <div className="px-8 py-12 text-center">
              <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
                notifications_none
              </span>
              <p className="text-sm text-on-surface-variant">
                No recent activity
              </p>
            </div>
          )}
          {(notifications ?? []).map((notif) => {
            const config = NOTIF_ICON[notif.type] ?? NOTIF_ICON.general;
            return (
              <div
                key={notif.id}
                className="flex items-center gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="material-symbols-outlined text-white text-sm">
                    {config.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">
                    {notif.title}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">
                    {notif.body}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">
                    <DateDisplay date={notif.created_at} format="relative" />
                  </span>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
