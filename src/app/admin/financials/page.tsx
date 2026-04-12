import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { DateDisplay } from "@/components/shared/date-display";
import { PaymentList } from "./payment-filters";
import { GatedSection } from "@/components/shared/gated-section";

const TABS = [
  { label: "Overview", href: "/admin/financials", icon: "monitoring" },
  { label: "Utilities", href: "/admin/financials/utilities", icon: "bolt" },
  { label: "Deposits", href: "/admin/financials/deposits", icon: "savings" },
];

export default async function AdminFinancials() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // ─── Fetch properties ───
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id, address_line1, city, province_state")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyMap: Record<string, { address_line1: string; city: string; province_state: string }> = {};
  for (const p of properties ?? []) {
    propertyMap[p.id] = { address_line1: p.address_line1, city: p.city, province_state: p.province_state };
  }

  // ─── Fetch leases for all properties ───
  let leases: any[] = [];
  let leaseIds: string[] = [];
  const leasePropertyMap: Record<string, string> = {};

  if (propertyIds.length > 0) {
    const { data: leaseData } = await supabase
      .from("rp_leases")
      .select("id, property_id, status")
      .in("property_id", propertyIds);

    leases = leaseData ?? [];
    leaseIds = leases.map((l) => l.id);
    for (const l of leases) {
      leasePropertyMap[l.id] = l.property_id;
    }
  }

  // ─── Total Revenue (all time, confirmed) ───
  let totalRevenue = 0;
  let allPayments: any[] = [];

  if (leaseIds.length > 0) {
    const { data: paymentData } = await supabase
      .from("rp_payments")
      .select(
        "id, lease_id, tenant_id, amount, surcharge_percent, surcharge_amount, total_charged, currency_code, payment_method, payment_for_month, status, created_at, rp_users!rp_payments_tenant_id_fkey(first_name, last_name)"
      )
      .in("lease_id", leaseIds)
      .order("created_at", { ascending: false });

    allPayments = paymentData ?? [];
    totalRevenue = allPayments
      .filter((p) => p.status === "confirmed")
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  }

  // ─── This Month Revenue ───
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const thisMonthRevenue = allPayments
    .filter((p) => {
      if (p.status !== "confirmed") return false;
      const d = p.created_at?.split("T")[0] ?? "";
      return d >= monthStart && d <= monthEnd;
    })
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  // ─── Rent Schedule ───
  let allRentSchedule: any[] = [];
  if (leaseIds.length > 0) {
    const { data: rsData } = await supabase
      .from("rp_rent_schedule")
      .select("id, lease_id, due_date, amount_due, amount_paid, balance_owing, currency_code, status, created_at")
      .in("lease_id", leaseIds)
      .order("due_date", { ascending: true });

    allRentSchedule = rsData ?? [];
  }

  // ─── Outstanding (due/overdue entries) ───
  const outstanding = allRentSchedule
    .filter((r) => r.status === "due" || r.status === "overdue")
    .reduce((sum, r) => sum + (Number(r.amount_due ?? 0) - Number(r.amount_paid ?? 0)), 0);

  // ─── Rent Collection Progress (current month) ───
  const currentMonthSchedule = allRentSchedule.filter((r) => {
    const d = r.due_date;
    return d >= monthStart && d <= monthEnd;
  });
  const totalDue = currentMonthSchedule.reduce(
    (sum: number, r: any) => sum + Number(r.amount_due ?? 0),
    0
  );
  const totalCollected = currentMonthSchedule.reduce(
    (sum: number, r: any) => sum + Number(r.amount_paid ?? 0),
    0
  );
  const collectionPercent =
    totalDue > 0 ? Math.min(100, Math.round((totalCollected / totalDue) * 100)) : 0;

  // ─── Revenue by Property ───
  const confirmedPayments = allPayments.filter((p) => p.status === "confirmed");
  const revenueByProperty: Record<string, { total: number; tenantIds: Set<string> }> = {};

  for (const p of confirmedPayments) {
    const propId = leasePropertyMap[p.lease_id];
    if (!propId) continue;
    if (!revenueByProperty[propId]) {
      revenueByProperty[propId] = { total: 0, tenantIds: new Set() };
    }
    revenueByProperty[propId].total += Number(p.amount ?? 0);
    if (p.tenant_id) revenueByProperty[propId].tenantIds.add(p.tenant_id);
  }

  const revenueRows = Object.entries(revenueByProperty)
    .map(([propId, data]) => ({
      propId,
      address: propertyMap[propId]?.address_line1 ?? "Unknown",
      city: propertyMap[propId]?.city ?? "",
      total: data.total,
      tenantCount: data.tenantIds.size,
    }))
    .sort((a, b) => b.total - a.total);

  // ─── Overdue Rents ───
  const overdueEntries = allRentSchedule.filter((r) => r.status === "overdue");

  // Get tenant names for overdue entries
  const overdueLeaseIds = Array.from(new Set(overdueEntries.map((r) => r.lease_id)));
  let overdueTenantMap: Record<string, string> = {};

  if (overdueLeaseIds.length > 0) {
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select("lease_id, rp_users!rp_lease_tenants_user_id_fkey(first_name, last_name)")
      .in("lease_id", overdueLeaseIds);

    for (const lt of leaseTenants ?? []) {
      const u = lt.rp_users as any;
      if (u) {
        const existing = overdueTenantMap[lt.lease_id];
        const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
        overdueTenantMap[lt.lease_id] = existing ? `${existing}, ${name}` : name;
      }
    }
  }

  const overdueRows = overdueEntries.map((r) => {
    const propId = leasePropertyMap[r.lease_id];
    const daysOverdue = Math.max(
      0,
      Math.floor(
        (now.getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    return {
      id: r.id,
      tenantName: overdueTenantMap[r.lease_id] ?? "—",
      address: propertyMap[propId]?.address_line1 ?? "—",
      amountDue: Number(r.amount_due ?? 0),
      amountPaid: Number(r.amount_paid ?? 0),
      dueDate: r.due_date,
      daysOverdue,
      currency: r.currency_code ?? "CAD",
    };
  });

  // ─── Enrich payments with tenant name and property address for client filtering ───
  const enrichedPayments = allPayments.map((p) => {
    const tenant = p.rp_users as any;
    const tenantName = tenant?.first_name
      ? `${tenant.first_name ?? ""} ${tenant.last_name ?? ""}`.trim()
      : "—";
    const propId = leasePropertyMap[p.lease_id];
    const address = propertyMap[propId]?.address_line1 ?? "Unknown";

    return {
      id: p.id,
      lease_id: p.lease_id,
      tenant_id: p.tenant_id,
      amount: p.amount,
      surcharge_percent: p.surcharge_percent,
      surcharge_amount: p.surcharge_amount,
      total_charged: p.total_charged,
      currency_code: p.currency_code,
      payment_method: p.payment_method,
      payment_for_month: p.payment_for_month,
      status: p.status,
      created_at: p.created_at,
      tenantName,
      propertyAddress: address,
    };
  });

  // ─── Summary Cards ───
  const summaryCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue, "CAD"),
      icon: "account_balance",
      sub: "All time",
      color: "text-tertiary",
    },
    {
      label: "This Month",
      value: formatCurrency(thisMonthRevenue, "CAD"),
      icon: "calendar_month",
      sub: now.toLocaleDateString("en-CA", { month: "long", year: "numeric" }),
      color: "text-primary",
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstanding, "CAD"),
      icon: "pending_actions",
      sub: `${overdueRows.length} overdue`,
      color: outstanding > 0 ? "text-error" : "text-tertiary",
    },
  ];

  return (
    <section className="space-y-8">
      {/* ─── Header + Nav Tabs ─── */}
      <div className="flex flex-col gap-4">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
          Financials
        </h1>
        <nav className="flex gap-1 bg-surface-container-low rounded-2xl p-1.5 w-fit">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab.href === "/admin/financials"
                  ? "bg-primary text-on-primary shadow-ambient-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">
                  {card.icon}
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {card.label}
              </span>
            </div>
            <p className={`text-2xl font-extrabold font-headline ${card.color}`}>
              {card.value}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Rent Collection Progress ─── */}
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
          {overdueRows.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-error-container">
              <span className="material-symbols-outlined text-on-error-container text-sm">
                warning
              </span>
              <span className="text-xs font-bold text-on-error-container">
                {overdueRows.length} overdue
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
              Remaining
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

      {/* ─── Revenue by Property (gated: Starter+) ─── */}
      <GatedSection featureKey="financial_reports" label="Financial Reports">
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">domain</span>
          <h3 className="font-headline font-bold text-lg">Revenue by Property</h3>
        </div>

        {revenueRows.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              bar_chart
            </span>
            <p className="text-sm text-on-surface-variant">
              No revenue data yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {revenueRows.map((row) => (
              <div
                key={row.propId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-primary-fixed-variant text-sm">
                      apartment
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {row.address}
                    </p>
                    <p className="text-xs text-on-surface-variant">{row.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(row.total, "CAD")}
                    </p>
                    <p className="text-xs text-on-surface-variant">collected</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">group</span>
                    {row.tenantCount} {row.tenantCount === 1 ? "tenant" : "tenants"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </GatedSection>

      {/* ─── Payment History (client component with search & filters) ─── */}
      <PaymentList payments={enrichedPayments} />

      {/* ─── Overdue Rents ─── */}
      {overdueRows.length > 0 && (
        <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
          <div className="px-6 md:px-8 py-5 bg-error-container flex items-center gap-3">
            <span className="material-symbols-outlined text-on-error-container">
              warning
            </span>
            <h3 className="font-headline font-bold text-lg text-on-error-container">
              Overdue Rents
            </h3>
            <span className="ml-auto text-xs font-bold text-on-error-container">
              {overdueRows.length} {overdueRows.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {/* Mobile: card layout */}
          <div className="block md:hidden divide-y divide-outline-variant/10">
            {overdueRows.map((row) => (
              <div key={row.id} className="px-6 py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {row.tenantName}
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {row.address}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error-container text-on-error-container">
                    {row.daysOverdue}d overdue
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-error">
                    {formatCurrency(row.amountDue - row.amountPaid, row.currency)}
                  </span>
                  <DateDisplay
                    date={row.dueDate}
                    format="short"
                    className="text-xs text-on-surface-variant"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant font-black">
                  <th className="px-6 md:px-8 py-3">Tenant</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3 text-right">Amount Due</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 pr-6 md:pr-8 text-right">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {overdueRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 md:px-8 py-4 text-sm font-medium text-primary">
                      {row.tenantName}
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">
                      {row.address}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-error text-right">
                      {formatCurrency(row.amountDue - row.amountPaid, row.currency)}
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface whitespace-nowrap">
                      <DateDisplay date={row.dueDate} format="medium" />
                    </td>
                    <td className="px-4 py-4 pr-6 md:pr-8 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error-container text-on-error-container">
                        {row.daysOverdue} {row.daysOverdue === 1 ? "day" : "days"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
