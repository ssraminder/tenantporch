import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";
import { RevenueChart } from "./revenue-chart";
import { ActivityLog, type ActivityItem } from "./activity-log";

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

import { DashboardFeatureCards } from "./feature-cards";

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
    .select("company_name, subscription_status, plan_id, rp_plans(name, slug)")
    .eq("user_id", rpUser.id)
    .single();

  const companyName = landlordProfile?.company_name ?? null;
  const planName =
    (landlordProfile?.rp_plans as any)?.name ?? "No plan";
  const planSlug: string =
    (landlordProfile?.rp_plans as any)?.slug ?? "free";

  // ─── Fetch properties ───
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id, address_line1, city")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyCount = propertyIds.length;
  const propertyMap: Record<string, { address_line1: string; city: string }> =
    {};
  for (const p of properties ?? []) {
    propertyMap[p.id] = { address_line1: p.address_line1, city: p.city };
  }

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
          "id, amount, status, payment_method, created_at, currency_code, rp_leases!inner(rp_properties(address_line1))"
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

  // ─── Tenants (up to 5) ───
  let tenantRows: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    propertyAddress: string;
    leaseStatusKey: string;
  }[] = [];

  if (propertyIds.length > 0) {
    const { data: allLeases } = await supabase
      .from("rp_leases")
      .select("id, property_id, start_date, end_date, status")
      .in("property_id", propertyIds);

    const allLeaseIds = (allLeases ?? []).map((l) => l.id);
    const leaseMap: Record<
      string,
      { id: string; property_id: string; start_date: string; end_date: string | null; status: string }
    > = {};
    for (const l of allLeases ?? []) {
      leaseMap[l.id] = l;
    }

    if (allLeaseIds.length > 0) {
      const { data: ltData } = await supabase
        .from("rp_lease_tenants")
        .select(
          "id, lease_id, user_id, rp_users!inner(id, first_name, last_name, email)"
        )
        .in("lease_id", allLeaseIds);

      // De-duplicate by user_id — keep the first occurrence (most recent lease)
      const seen = new Set<string>();
      for (const lt of ltData ?? []) {
        const tenantUser = lt.rp_users as any;
        if (!tenantUser || seen.has(tenantUser.id)) continue;
        seen.add(tenantUser.id);

        const lease = leaseMap[lt.lease_id];
        const prop = lease ? propertyMap[lease.property_id] : null;
        const displayStatus = lease
          ? getLeaseDisplayStatus(lease)
          : { label: "Unknown", key: "unknown" };

        tenantRows.push({
          userId: tenantUser.id,
          firstName: tenantUser.first_name ?? "",
          lastName: tenantUser.last_name ?? "",
          email: tenantUser.email ?? "",
          propertyAddress: prop
            ? `${prop.address_line1}, ${prop.city}`
            : "No property",
          leaseStatusKey: displayStatus.key,
        });

        if (tenantRows.length >= 5) break;
      }
    }
  }

  // ─── Security Deposits Summary ───
  let totalDepositsHeld = 0;
  let depositCount = 0;
  let depositRows: {
    leaseId: string;
    address: string;
    amount: number;
    paidDate: string | null;
    currency: string;
  }[] = [];

  if (propertyIds.length > 0) {
    const { data: depositLeases } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, security_deposit, deposit_paid_date, currency_code, status"
      )
      .in("property_id", propertyIds)
      .gt("security_deposit", 0)
      .order("start_date", { ascending: false });

    const activeDeposits = (depositLeases ?? []).filter(
      (l) => l.status === "active" && l.deposit_paid_date
    );
    totalDepositsHeld = activeDeposits.reduce(
      (sum, l) => sum + Number(l.security_deposit ?? 0),
      0
    );
    depositCount = activeDeposits.length;

    depositRows = activeDeposits.slice(0, 5).map((lease) => {
      const prop = propertyMap[lease.property_id];
      return {
        leaseId: lease.id,
        address: prop
          ? `${prop.address_line1}, ${prop.city}`
          : "Unknown",
        amount: Number(lease.security_deposit ?? 0),
        paidDate: lease.deposit_paid_date,
        currency: lease.currency_code ?? "CAD",
      };
    });
  }

  // ─── Recent Notifications (last 5) ───
  const { data: notifications } = await supabase
    .from("rp_notifications")
    .select("*")
    .eq("user_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // ─── Revenue Trend (last 12 months) ───
  let revenueTrendData: { month: string; revenue: number; count: number }[] =
    [];
  if (propertyIds.length > 0) {
    const { data: trendLeases } = await supabase
      .from("rp_leases")
      .select("id")
      .in("property_id", propertyIds);

    const trendLeaseIds = (trendLeases ?? []).map((l) => l.id);

    if (trendLeaseIds.length > 0) {
      const twelveMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1
      );
      const trendStart = twelveMonthsAgo.toISOString().split("T")[0];

      const { data: allPayments } = await supabase
        .from("rp_payments")
        .select("amount, created_at")
        .in("lease_id", trendLeaseIds)
        .eq("status", "confirmed")
        .gte("created_at", `${trendStart}T00:00:00`)
        .order("created_at", { ascending: true });

      // Build a map for every month in the 12-month window
      const monthMap = new Map<
        string,
        { revenue: number; count: number }
      >();
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const key = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        monthMap.set(key, { revenue: 0, count: 0 });
      }

      for (const p of allPayments ?? []) {
        const payDate = new Date(p.created_at);
        const key = payDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const entry = monthMap.get(key);
        if (entry) {
          entry.revenue += Number(p.amount ?? 0);
          entry.count += 1;
        }
      }

      revenueTrendData = Array.from(monthMap.entries()).map(
        ([month, data]) => ({
          month,
          revenue: data.revenue,
          count: data.count,
        })
      );
    }
  }

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

  // ─── Compute unified Activity Log ───
  const activityItems: ActivityItem[] = [];

  // Add recent payments to activity log
  for (const payment of recentPayments) {
    const tenant = payment.rp_users as any;
    const tenantName = tenant
      ? `${tenant.first_name} ${tenant.last_name}`
      : "Unknown tenant";
    activityItems.push({
      id: `payment-${payment.id}`,
      type: "payment",
      title: `Payment received from ${tenantName}`,
      description: `${formatCurrency(Number(payment.amount ?? 0), payment.currency_code ?? "CAD")} — ${payment.status}`,
      timestamp: payment.created_at,
      icon: "payments",
      color: "bg-tertiary",
    });
  }

  // Add maintenance requests to activity log
  for (const req of maintenanceRequests) {
    const statusLabel =
      req.status === "in_progress"
        ? "In Progress"
        : req.status.charAt(0).toUpperCase() + req.status.slice(1);
    activityItems.push({
      id: `maintenance-${req.id}`,
      type: "maintenance",
      title: `Maintenance request: ${req.title}`,
      description: `${statusLabel} — ${req.urgency} urgency`,
      timestamp: req.created_at,
      icon: "handyman",
      color: "bg-secondary",
    });
  }

  // Add notifications to activity log
  for (const notif of notifications ?? []) {
    const config = NOTIF_ICON[notif.type] ?? NOTIF_ICON.general;
    activityItems.push({
      id: `notif-${notif.id}`,
      type: "message",
      title: notif.title,
      description: notif.body ?? "",
      timestamp: notif.created_at,
      icon: config.icon,
      color: config.color,
    });
  }

  // Sort all activity items by timestamp, most recent first
  activityItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <section className="space-y-8">
      {/* ─── Welcome Hero ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-8 md:p-10 flex flex-col justify-end min-h-[200px] shadow-ambient-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary opacity-80" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/30 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
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

      {/* ─── Revenue Trend Chart ─── */}
      <RevenueChart data={revenueTrendData} />

      {/* ─── Tenants ─── */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              group
            </span>
            <h3 className="font-headline font-bold text-lg">Tenants</h3>
          </div>
          <Link
            href="/admin/tenants"
            className="text-xs font-bold text-primary hover:underline"
          >
            View All
          </Link>
        </div>

        {tenantRows.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              person_off
            </span>
            <p className="text-sm text-on-surface-variant">
              No tenants yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {tenantRows.map((tenant) => (
              <Link
                key={tenant.userId}
                href={`/admin/tenants/${tenant.userId}`}
                className="flex items-center gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors"
              >
                {/* Initials avatar */}
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-on-primary-fixed-variant">
                    {tenant.firstName?.[0]?.toUpperCase() ?? ""}
                    {tenant.lastName?.[0]?.toUpperCase() ?? ""}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-primary truncate">
                      {tenant.firstName} {tenant.lastName}
                    </p>
                    <StatusBadge status={tenant.leaseStatusKey} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1 truncate">
                      <span className="material-symbols-outlined text-xs">
                        mail
                      </span>
                      {tenant.email}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <span className="material-symbols-outlined text-xs">
                        apartment
                      </span>
                      {tenant.propertyAddress}
                    </span>
                  </div>
                </div>

                <span className="material-symbols-outlined text-outline-variant text-sm flex-shrink-0">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ─── Security Deposits Summary ─── */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              savings
            </span>
            <h3 className="font-headline font-bold text-xl">
              Security Deposits
            </h3>
          </div>
          <Link
            href="/admin/financials/deposits"
            className="text-xs font-bold text-primary hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Total Deposits Held
            </p>
            <p className="text-2xl font-extrabold font-headline text-primary">
              {formatCurrency(totalDepositsHeld, "CAD")}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Active Deposits
            </p>
            <p className="text-2xl font-extrabold font-headline text-primary">
              {depositCount}
            </p>
          </div>
        </div>

        {depositRows.length > 0 && (
          <div className="divide-y divide-outline-variant/10 rounded-xl bg-surface-container-low overflow-hidden">
            {depositRows.map((row) => (
              <div
                key={row.leaseId}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">
                    apartment
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {row.address}
                    </p>
                    {row.paidDate && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Paid{" "}
                        <DateDisplay date={row.paidDate} format="short" />
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-on-surface whitespace-nowrap ml-4">
                  {formatCurrency(row.amount, row.currency)}
                </p>
              </div>
            ))}
          </div>
        )}

        {depositRows.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-on-surface-variant">
              No active security deposits recorded.
            </p>
          </div>
        )}
      </div>

      {/* ─── Quick Setup / Premium Features ─── */}
      <DashboardFeatureCards />

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
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 pr-6 md:pr-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentPayments.map((payment) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const propertyAddress = (payment.rp_leases as any)?.rp_properties?.address_line1 ?? "—";
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
                          {propertyAddress}
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

      {/* ─── Activity Log ─── */}
      <ActivityLog items={activityItems} />
    </section>
  );
}
