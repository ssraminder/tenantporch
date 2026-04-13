import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { DateDisplay } from "@/components/shared/date-display";
import { GatedSection } from "@/components/shared/gated-section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

const UTILITY_ICONS: Record<string, string> = {
  electricity: "bolt",
  gas: "local_fire_department",
  water: "water_drop",
  internet: "wifi",
  sewer: "plumbing",
  trash: "delete_sweep",
  other: "category",
};

const UTILITY_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas: "Gas",
  water: "Water",
  internet: "Internet",
  sewer: "Sewer",
  trash: "Garbage",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-surface-container-high text-on-surface-variant",
  sent: "bg-primary/10 text-primary",
  paid: "bg-tertiary-container text-on-tertiary-container",
  overdue: "bg-error-container text-on-error-container",
  cancelled: "bg-surface-container-high text-outline",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export default async function UtilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;

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

  if (!rpUser) redirect("/admin/dashboard");

  // Fetch all properties for this landlord
  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id, address_line1, city")
    .eq("landlord_id", rpUser.id);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyMap: Record<string, { address_line1: string; city: string }> = {};
  for (const p of properties ?? []) {
    propertyMap[p.id] = { address_line1: p.address_line1, city: p.city };
  }

  // Fetch utility bills
  let billQuery = supabase
    .from("rp_utility_bills")
    .select("id, property_id, utility_type, billing_period, total_amount, tenant_amount, currency_code, due_date, status, sent_at, paid_at, created_at")
    .in("property_id", propertyIds.length > 0 ? propertyIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  if (filter && filter !== "all") {
    billQuery = billQuery.eq("status", filter);
  }

  const { data: bills } = await billQuery;
  const allBills = bills ?? [];

  // Summary stats
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const billsThisMonth = allBills.filter(
    (b) => new Date(b.created_at) >= thisMonthStart
  );
  const billedThisMonth = billsThisMonth.reduce(
    (sum, b) => sum + Number(b.tenant_amount),
    0
  );
  const paidThisMonth = billsThisMonth
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + Number(b.tenant_amount), 0);
  const outstanding = allBills
    .filter((b) => b.status === "sent" || b.status === "overdue")
    .reduce((sum, b) => sum + Number(b.tenant_amount), 0);

  const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "overdue", label: "Overdue" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <section className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Utilities" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">bolt</span>
          </div>
          <div>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
              Utility Billing
            </h1>
            <p className="text-sm text-on-surface-variant">
              Track and send utility bills to tenants
            </p>
          </div>
        </div>
        <Link
          href="/admin/utilities/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Utility Bill
        </Link>
      </div>

      <GatedSection featureKey="utility_splitting" label="Utility Billing">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Billed This Month
          </p>
          <p className="text-2xl font-extrabold font-headline text-primary">
            {formatCurrency(billedThisMonth, "CAD")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Tenant share</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Collected This Month
          </p>
          <p className="text-2xl font-extrabold font-headline text-tertiary">
            {formatCurrency(paidThisMonth, "CAD")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Confirmed payments</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Outstanding
          </p>
          <p className={`text-2xl font-extrabold font-headline ${outstanding > 0 ? "text-error" : "text-on-surface"}`}>
            {formatCurrency(outstanding, "CAD")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Sent + overdue bills</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1.5 w-fit overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/utilities?filter=${tab.key}`}
            className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === tab.key
                ? "bg-primary text-on-primary shadow-ambient-sm"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Bill list */}
      {allBills.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-outline-variant">
              bolt
            </span>
          </div>
          <h3 className="font-headline font-bold text-on-surface mb-2">
            No Utility Bills Yet
          </h3>
          <p className="text-sm text-on-surface-variant max-w-sm mb-6">
            Add utility bills to track electricity, gas, water, and more. Tenant shares are auto-calculated from their lease split percentage.
          </p>
          <Link
            href="/admin/utilities/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add First Utility Bill
          </Link>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
          <div className="divide-y divide-outline-variant/10">
            {allBills.map((bill) => {
              const prop = propertyMap[bill.property_id];
              const icon = UTILITY_ICONS[bill.utility_type] ?? "category";
              const label = UTILITY_LABELS[bill.utility_type] ?? bill.utility_type;
              const statusStyle = STATUS_STYLES[bill.status] ?? STATUS_STYLES.draft;
              const statusLabel = STATUS_LABELS[bill.status] ?? bill.status;

              return (
                <Link
                  key={bill.id}
                  href={`/admin/utilities/${bill.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-lg">
                      {icon}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-on-surface">
                        {label}
                      </p>
                      {bill.billing_period && (
                        <span className="text-xs text-on-surface-variant">
                          {bill.billing_period}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {prop?.address_line1 ?? "Unknown property"}
                      {prop?.city ? `, ${prop.city}` : ""}
                    </p>
                  </div>

                  {/* Amounts */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-on-surface">
                      {formatCurrency(Number(bill.tenant_amount), bill.currency_code ?? "CAD")}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      tenant share
                    </p>
                  </div>

                  {/* Due date */}
                  {bill.due_date && (
                    <div className="text-right flex-shrink-0 hidden md:block">
                      <p className="text-xs text-on-surface-variant">Due</p>
                      <DateDisplay date={bill.due_date} format="short" className="text-xs font-semibold text-on-surface" />
                    </div>
                  )}

                  {/* Status */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${statusStyle}`}>
                    {statusLabel}
                  </span>

                  <span className="material-symbols-outlined text-outline-variant text-sm flex-shrink-0">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      </GatedSection>
    </section>
  );
}
