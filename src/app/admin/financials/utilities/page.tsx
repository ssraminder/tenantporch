import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { DateDisplay } from "@/components/shared/date-display";
import { GatedSection } from "@/components/shared/gated-section";

const TABS = [
  { label: "Overview", href: "/admin/financials", icon: "monitoring" },
  { label: "Utilities", href: "/admin/financials/utilities", icon: "bolt" },
  { label: "Deposits", href: "/admin/financials/deposits", icon: "savings" },
];

export default async function UtilitiesPage() {
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

  // ─── Fetch active leases with utility split ───
  let activeLeases: any[] = [];
  if (propertyIds.length > 0) {
    const { data: leaseData } = await supabase
      .from("rp_leases")
      .select(
        "id, property_id, monthly_rent, currency_code, utility_split_percent, status"
      )
      .in("property_id", propertyIds)
      .eq("status", "active");

    activeLeases = leaseData ?? [];
  }

  // Build per-property utility split cards (one per property with active lease)
  const utilitySplitCards = activeLeases.map((lease) => {
    const prop = propertyMap[lease.property_id];
    const splitPercent = Number(lease.utility_split_percent ?? 0);
    const monthlyRent = Number(lease.monthly_rent ?? prop?.monthly_rent ?? 0);
    const currency = lease.currency_code ?? "CAD";

    return {
      leaseId: lease.id,
      propertyId: lease.property_id,
      address: prop?.address_line1 ?? "Unknown",
      city: prop?.city ?? "",
      province: prop?.province_state ?? "",
      splitPercent,
      monthlyRent,
      currency,
    };
  });

  // ─── Recent Utility Documents ───
  let utilityDocuments: any[] = [];
  if (propertyIds.length > 0) {
    const { data: docs } = await supabase
      .from("rp_documents")
      .select("id, title, property_id, created_at")
      .in("property_id", propertyIds)
      .eq("category", "utility_bill")
      .order("created_at", { ascending: false })
      .limit(10);

    utilityDocuments = docs ?? [];
  }

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
            Utility Billing
          </h1>
        </div>
        <nav className="flex gap-1 bg-surface-container-low rounded-2xl p-1.5 w-fit">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab.href === "/admin/financials/utilities"
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

      {/* ─── Gated: Utility Splitting requires Starter+ ─── */}
      <GatedSection featureKey="utility_splitting" label="Utility Splitting">

      {/* ─── Info Banner ─── */}
      <div className="bg-primary-fixed/20 rounded-2xl p-5 md:p-6 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-on-primary-fixed-variant">
            info
          </span>
        </div>
        <div>
          <h4 className="font-headline font-bold text-on-primary-fixed-variant text-sm mb-1">
            How Utility Splits Work
          </h4>
          <p className="text-sm text-on-primary-fixed-variant/80 leading-relaxed">
            Utility costs are split between landlord and tenant based on the
            percentage set in each lease. Upload utility bills as documents to
            keep records. Adjust the split percentage in the lease settings for
            each property.
          </p>
        </div>
      </div>

      {/* ─── Per-Property Utility Split Cards ─── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="material-symbols-outlined text-primary">bolt</span>
          <h3 className="font-headline font-bold text-xl text-on-surface">
            Utility Splits by Property
          </h3>
        </div>

        {utilitySplitCards.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-outline-variant">
                bolt
              </span>
            </div>
            <h4 className="font-headline font-bold text-on-surface mb-2">
              No Active Leases
            </h4>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Utility split information will appear here once you have active
              leases with utility percentages configured.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {utilitySplitCards.map((card) => (
                <div
                  key={card.leaseId}
                  className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm overflow-hidden"
                >
                  {/* Accent bar */}
                  <div className="h-1 bg-secondary-fixed-dim" />

                  <div className="p-5 space-y-4">
                    {/* Address */}
                    <div>
                      <h4 className="font-headline font-bold text-on-surface truncate">
                        {card.address}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {card.city}, {card.province}
                      </p>
                    </div>

                    {/* Split percentage visual */}
                    <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Tenant pays
                        </span>
                        <span className="text-lg font-extrabold font-headline text-secondary">
                          {card.splitPercent}%
                        </span>
                      </div>

                      {/* Split bar */}
                      <div className="overflow-hidden h-2.5 rounded-full bg-surface-container-high">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary-fixed-dim transition-all duration-300"
                          style={{ width: `${card.splitPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Tenant: {card.splitPercent}%</span>
                        <span>Landlord: {100 - card.splitPercent}%</span>
                      </div>
                    </div>

                    {/* Rent info (separate from utility split) */}
                    <div className="flex items-center justify-between py-2 border-t border-outline-variant/10">
                      <span className="text-xs text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">payments</span>
                        Monthly Rent
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(card.monthlyRent, card.currency)}
                      </span>
                    </div>

                    {/* Hint */}
                    <p className="text-xs text-on-surface-variant/70 leading-relaxed">
                      Upload utility bills as documents to track actual costs.
                      The split percentage applies to utility expenses, not rent.
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ─── Recent Utility Documents ─── */}
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              description
            </span>
            <h3 className="font-headline font-bold text-lg">
              Recent Utility Documents
            </h3>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            {utilityDocuments.length}{" "}
            {utilityDocuments.length === 1 ? "document" : "documents"}
          </span>
        </div>

        {utilityDocuments.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
              upload_file
            </span>
            <p className="text-sm text-on-surface-variant mb-1">
              No utility documents uploaded yet
            </p>
            <p className="text-xs text-on-surface-variant">
              Upload utility bills from the property documents section.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {utilityDocuments.map((doc) => {
              const prop = propertyMap[doc.property_id];
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-fixed-variant text-sm">
                      receipt_long
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {doc.title ?? "Utility Bill"}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        location_on
                      </span>
                      {prop?.address_line1 ?? "Unknown property"}
                    </p>
                  </div>
                  <DateDisplay
                    date={doc.created_at}
                    format="medium"
                    className="text-xs text-on-surface-variant whitespace-nowrap"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      </GatedSection>
    </section>
  );
}
