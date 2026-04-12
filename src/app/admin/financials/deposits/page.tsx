import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";

const TABS = [
  { label: "Overview", href: "/admin/financials", icon: "monitoring" },
  { label: "Utilities", href: "/admin/financials/utilities", icon: "bolt" },
  { label: "Deposits", href: "/admin/financials/deposits", icon: "savings" },
];

export default async function DepositsPage() {
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
    .select("id, address_line1, city, province_state, monthly_rent")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyMap: Record<
    string,
    { address_line1: string; city: string; province_state: string; monthly_rent: number }
  > = {};
  for (const p of properties ?? []) {
    propertyMap[p.id] = {
      address_line1: p.address_line1,
      city: p.city,
      province_state: p.province_state,
      monthly_rent: Number(p.monthly_rent ?? 0),
    };
  }

  // ─── Fetch leases with security deposits ───
  let leasesWithDeposits: any[] = [];
  if (propertyIds.length > 0) {
    const { data: leaseData } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, security_deposit, deposit_paid_date, monthly_rent, currency_code, start_date, end_date, status"
      )
      .in("property_id", propertyIds)
      .gt("security_deposit", 0)
      .order("start_date", { ascending: false });

    leasesWithDeposits = leaseData ?? [];
  }

  // ─── Fetch tenants for these leases ───
  const leaseIds = leasesWithDeposits.map((l) => l.id);
  let tenantsByLease: Record<string, string> = {};

  if (leaseIds.length > 0) {
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select(
        "lease_id, rp_users!rp_lease_tenants_user_id_fkey(first_name, last_name)"
      )
      .in("lease_id", leaseIds);

    for (const lt of leaseTenants ?? []) {
      const u = lt.rp_users as any;
      if (u) {
        const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
        const existing = tenantsByLease[lt.lease_id];
        tenantsByLease[lt.lease_id] = existing ? `${existing}, ${name}` : name;
      }
    }
  }

  // ─── Summary: active leases only ───
  const activeDeposits = leasesWithDeposits.filter(
    (l) => l.status === "active" && l.deposit_paid_date
  );
  const totalDepositsHeld = activeDeposits.reduce(
    (sum, l) => sum + Number(l.security_deposit ?? 0),
    0
  );
  const depositCount = activeDeposits.length;

  // ─── Build deposit rows ───
  const depositRows = leasesWithDeposits.map((lease) => {
    const prop = propertyMap[lease.property_id];
    return {
      leaseId: lease.id,
      address: prop?.address_line1 ?? "Unknown",
      city: prop?.city ?? "",
      province: prop?.province_state ?? "",
      tenantNames: tenantsByLease[lease.id] ?? "No tenants assigned",
      depositAmount: Number(lease.security_deposit ?? 0),
      depositPaidDate: lease.deposit_paid_date,
      leaseStatus: lease.status,
      startDate: lease.start_date,
      endDate: lease.end_date,
      currency: lease.currency_code ?? "CAD",
      monthlyRent: Number(lease.monthly_rent ?? 0),
    };
  });

  return (
    <section className="space-y-8">
      {/* ─── Header + Nav Tabs ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/financials"
            className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              arrow_back
            </span>
          </Link>
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
            Security Deposits
          </h1>
        </div>
        <nav className="flex gap-1 bg-surface-container-low rounded-2xl p-1.5 w-fit">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab.href === "/admin/financials/deposits"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">
                savings
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Total Deposits Held
            </span>
          </div>
          <p className="text-2xl font-extrabold font-headline text-primary">
            {formatCurrency(totalDepositsHeld, "CAD")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            From active leases
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">
                receipt_long
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Active Deposits
            </span>
          </div>
          <p className="text-2xl font-extrabold font-headline text-primary">
            {depositCount}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {leasesWithDeposits.length} total across all leases
          </p>
        </div>
      </div>

      {/* ─── Deposit List ─── */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              account_balance
            </span>
            <h3 className="font-headline font-bold text-lg">All Deposits</h3>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            {depositRows.length}{" "}
            {depositRows.length === 1 ? "deposit" : "deposits"}
          </span>
        </div>

        {depositRows.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              savings
            </span>
            <p className="text-sm text-on-surface-variant mb-1">
              No security deposits recorded
            </p>
            <p className="text-xs text-on-surface-variant">
              Deposits will appear here when set up in lease agreements.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="block md:hidden divide-y divide-outline-variant/10">
              {depositRows.map((row) => (
                <div key={row.leaseId} className="px-6 py-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {row.address}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {row.city}, {row.province}
                      </p>
                    </div>
                    <StatusBadge status={row.leaseStatus} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">
                      group
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {row.tenantNames}
                    </span>
                  </div>

                  <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant">
                        Deposit
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(row.depositAmount, row.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant">
                        Paid
                      </span>
                      {row.depositPaidDate ? (
                        <DateDisplay
                          date={row.depositPaidDate}
                          format="medium"
                          className="text-xs font-semibold text-tertiary"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-secondary">
                          Not yet paid
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant">
                        Lease
                      </span>
                      <span className="text-xs text-on-surface">
                        <DateDisplay date={row.startDate} format="short" />
                        {row.endDate && (
                          <>
                            {" "}&ndash;{" "}
                            <DateDisplay date={row.endDate} format="short" />
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant font-black">
                    <th className="px-6 md:px-8 py-3">Property</th>
                    <th className="px-4 py-3">Tenant(s)</th>
                    <th className="px-4 py-3 text-right">Deposit</th>
                    <th className="px-4 py-3">Date Paid</th>
                    <th className="px-4 py-3">Lease Dates</th>
                    <th className="px-4 py-3 pr-6 md:pr-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {depositRows.map((row) => (
                    <tr
                      key={row.leaseId}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-6 md:px-8 py-4">
                        <p className="text-sm font-semibold text-primary">
                          {row.address}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {row.city}, {row.province}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface max-w-[200px] truncate">
                        {row.tenantNames}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-primary text-right">
                        {formatCurrency(row.depositAmount, row.currency)}
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        {row.depositPaidDate ? (
                          <DateDisplay
                            date={row.depositPaidDate}
                            format="medium"
                            className="text-tertiary font-semibold"
                          />
                        ) : (
                          <span className="text-secondary font-semibold">
                            Not yet paid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface whitespace-nowrap">
                        <DateDisplay date={row.startDate} format="short" />
                        {row.endDate && (
                          <>
                            {" "}&ndash;{" "}
                            <DateDisplay date={row.endDate} format="short" />
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4 pr-6 md:pr-8">
                        <StatusBadge status={row.leaseStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ─── Alberta Compliance Note ─── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-primary-fixed/20 flex items-center gap-3">
          <span className="material-symbols-outlined text-on-primary-fixed-variant">
            gavel
          </span>
          <h3 className="font-headline font-bold text-lg text-on-primary-fixed-variant">
            Alberta Security Deposit Rules
          </h3>
        </div>
        <div className="px-6 md:px-8 py-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm">
                  currency_exchange
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Maximum Amount
                </span>
              </div>
              <p className="text-sm text-on-surface leading-relaxed">
                Security deposit cannot exceed{" "}
                <span className="font-bold text-primary">
                  one month&apos;s rent
                </span>
                . Any amount collected above this is in violation of the
                Residential Tenancies Act.
              </p>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm">
                  account_balance
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Trust Account
                </span>
              </div>
              <p className="text-sm text-on-surface leading-relaxed">
                Deposits must be held in a{" "}
                <span className="font-bold text-primary">trust account</span> at
                a financial institution in Alberta. Interest earned belongs to the
                landlord unless otherwise agreed.
              </p>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm">
                  schedule
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Return Timeline
                </span>
              </div>
              <p className="text-sm text-on-surface leading-relaxed">
                Must be returned within{" "}
                <span className="font-bold text-primary">10 days</span> of lease
                end, unless the landlord files a claim with the RTDRS or court for
                damages or unpaid rent.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-secondary-fixed/10 rounded-xl p-4 mt-2">
            <span className="material-symbols-outlined text-on-secondary-fixed-variant text-sm flex-shrink-0 mt-0.5">
              info
            </span>
            <p className="text-xs text-on-secondary-fixed-variant leading-relaxed">
              Under the Alberta{" "}
              <span className="font-semibold">
                Residential Tenancies Act (RTA)
              </span>
              , a landlord who fails to return a security deposit or provide a
              statement of account within 10 days may be required to return the
              full deposit amount. Landlords should document property condition at
              move-in and move-out with photos and a signed inspection report.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
