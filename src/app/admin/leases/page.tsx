import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";

const SIGNING_STATUS_LABELS: Record<string, string> = {
  draft: "Not Sent",
  sent: "Awaiting Signatures",
  partially_signed: "Partially Signed",
  completed: "Fully Signed",
  signed_offline: "Signed Offline",
};

function formatCurrency(amount: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(
    amount
  );
}

export default async function AdminLeasesPage() {
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

  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id, address_line1, city, province_state, postal_code")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyMap = new Map(
    (properties ?? []).map((p) => [p.id, p] as const)
  );

  type LeaseRow = {
    id: string;
    property_id: string;
    start_date: string;
    end_date: string | null;
    monthly_rent: number;
    currency_code: string;
    status: string;
    signing_status: string | null;
    created_at: string;
  };

  let leases: LeaseRow[] = [];
  if (propertyIds.length > 0) {
    const { data } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, start_date, end_date, monthly_rent, currency_code, status, signing_status, created_at"
      )
      .in("property_id", propertyIds)
      .order("start_date", { ascending: false });
    leases = (data as LeaseRow[]) ?? [];
  }

  const leaseIds = leases.map((l) => l.id);

  // Tenant counts per lease
  const tenantCounts = new Map<string, number>();
  if (leaseIds.length > 0) {
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select("lease_id")
      .in("lease_id", leaseIds);
    for (const lt of leaseTenants ?? []) {
      tenantCounts.set(lt.lease_id, (tenantCounts.get(lt.lease_id) ?? 0) + 1);
    }
  }

  // Group by status bucket
  const buckets: Record<string, LeaseRow[]> = {
    active: [],
    upcoming: [],
    expiring: [],
    draft: [],
    expired: [],
    terminated: [],
  };

  for (const l of leases) {
    const status = getLeaseDisplayStatus(l).key;
    if (status === "active") buckets.active.push(l);
    else if (status === "upcoming_lease") buckets.upcoming.push(l);
    else if (status === "expiring_soon") buckets.expiring.push(l);
    else if (status === "draft") buckets.draft.push(l);
    else if (status === "expired") buckets.expired.push(l);
    else if (status === "terminated") buckets.terminated.push(l);
  }

  const sections: { title: string; rows: LeaseRow[]; emptyHint?: string }[] = [
    { title: "Active", rows: buckets.active },
    { title: "Upcoming", rows: buckets.upcoming },
    { title: "Expiring Soon", rows: buckets.expiring },
    { title: "Drafts", rows: buckets.draft },
    { title: "Expired / Terminated", rows: [...buckets.expired, ...buckets.terminated] },
  ];

  return (
    <section className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Leases" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-primary tracking-tighter leading-tight">
            Leases
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            All tenancies across your portfolio.
          </p>
        </div>
      </div>

      {leases.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
            description
          </span>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">
            No Leases Yet
          </h2>
          <p className="text-on-surface-variant mb-4">
            Create a lease from a property to get started.
          </p>
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90"
          >
            <span className="material-symbols-outlined text-sm">domain</span>
            Go to Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) =>
            section.rows.length === 0 ? null : (
              <div key={section.title}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-headline text-lg font-bold text-primary">
                    {section.title}
                  </h2>
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {section.rows.length} lease
                    {section.rows.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-container-low text-on-surface-variant">
                      <tr className="text-left">
                        <th className="px-5 py-3 font-bold text-[11px] uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-5 py-3 font-bold text-[11px] uppercase tracking-wider">
                          Term
                        </th>
                        <th className="px-5 py-3 font-bold text-[11px] uppercase tracking-wider">
                          Rent
                        </th>
                        <th className="px-5 py-3 font-bold text-[11px] uppercase tracking-wider">
                          Tenants
                        </th>
                        <th className="px-5 py-3 font-bold text-[11px] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-5 py-3 font-bold text-[11px] uppercase tracking-wider">
                          Signing
                        </th>
                        <th className="px-5 py-3 font-bold text-[11px] uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {section.rows.map((l) => {
                        const property = propertyMap.get(l.property_id);
                        const display = getLeaseDisplayStatus(l);
                        const tenantCount = tenantCounts.get(l.id) ?? 0;
                        const signingStatus = l.signing_status ?? "draft";
                        return (
                          <tr
                            key={l.id}
                            className="hover:bg-surface-container-low transition-colors"
                          >
                            <td className="px-5 py-4">
                              <Link
                                href={`/admin/leases/${l.id}/document`}
                                className="font-bold text-primary hover:underline"
                              >
                                {property?.address_line1 ?? "—"}
                              </Link>
                              {property?.city && (
                                <p className="text-xs text-on-surface-variant">
                                  {property.city}
                                  {property.province_state
                                    ? `, ${property.province_state}`
                                    : ""}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-on-surface-variant">
                              <DateDisplay date={l.start_date} format="short" />
                              {" → "}
                              {l.end_date ? (
                                <DateDisplay date={l.end_date} format="short" />
                              ) : (
                                "month-to-month"
                              )}
                            </td>
                            <td className="px-5 py-4 font-bold text-on-surface">
                              {formatCurrency(
                                Number(l.monthly_rent),
                                l.currency_code
                              )}
                            </td>
                            <td className="px-5 py-4 text-on-surface-variant">
                              {tenantCount}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={display.key} />
                            </td>
                            <td className="px-5 py-4 text-xs text-on-surface-variant">
                              {SIGNING_STATUS_LABELS[signingStatus] ??
                                signingStatus}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/admin/leases/${l.id}/document`}
                                className="inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline"
                              >
                                Open
                                <span className="material-symbols-outlined text-sm">
                                  arrow_forward
                                </span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
