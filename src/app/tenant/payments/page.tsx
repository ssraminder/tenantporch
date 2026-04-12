import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/currency";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { RentCountdown } from "@/components/shared/rent-countdown";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";
import { PayRentSection } from "./pay-rent-section";

export default async function PaymentsPage() {
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

  // Fetch lease — include active and draft (upcoming) leases
  const { data: leaseLinks } = await supabase
    .from("rp_lease_tenants")
    .select("lease_id, rp_leases!inner(id, status)")
    .eq("user_id", rpUser.id)
    .in("rp_leases.status", ["active", "draft"]);

  const sortedLinks = (leaseLinks ?? []).sort((a, b) => {
    const aStatus = (a as any).rp_leases?.status ?? "";
    const bStatus = (b as any).rp_leases?.status ?? "";
    if (aStatus === "active" && bStatus !== "active") return -1;
    if (bStatus === "active" && aStatus !== "active") return 1;
    return 0;
  });
  const leaseLink = sortedLinks[0] ?? null;

  if (!leaseLink)
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
          account_balance_wallet
        </span>
        <h2 className="font-headline text-2xl font-bold text-primary mb-2">No Active Lease</h2>
        <p className="text-on-surface-variant">You don&apos;t have an active lease yet.</p>
      </div>
    );

  const { data: lease } = await supabase
    .from("rp_leases")
    .select("*")
    .eq("id", leaseLink.lease_id)
    .single();

  const { data: property } = await supabase
    .from("rp_properties")
    .select("address_line1, city, province_state, landlord_id")
    .eq("id", lease!.property_id)
    .single();

  const { data: rentSchedule } = await supabase
    .from("rp_rent_schedule")
    .select("*")
    .eq("lease_id", lease!.id)
    .order("due_date", { ascending: true });

  const { data: payments } = await supabase
    .from("rp_payments")
    .select("*")
    .eq("lease_id", lease!.id)
    .eq("tenant_id", rpUser.id)
    .order("created_at", { ascending: false });

  const nextDue = (rentSchedule ?? []).find((r) =>
    ["upcoming", "due", "overdue", "partial"].includes(r.status)
  );

  // ─── Fix: Use amount_due (NOT balance_owing) for current balance ───
  const currentBalance = (rentSchedule ?? [])
    .filter((r) => ["due", "overdue", "partial"].includes(r.status))
    .reduce((sum, r) => sum + Number(r.amount_due ?? 0) - Number(r.amount_paid ?? 0), 0);

  const surcharge = Number(lease?.card_surcharge_percent ?? 0);
  const currency = lease?.currency_code ?? "CAD";

  // ─── Lease display status ───
  const leaseDisplayStatus = lease ? getLeaseDisplayStatus(lease) : null;
  const isLeaseEnded =
    leaseDisplayStatus?.key === "expired" ||
    leaseDisplayStatus?.key === "terminated";
  const isLeaseUpcoming =
    leaseDisplayStatus?.key === "upcoming_lease" ||
    leaseDisplayStatus?.key === "draft";

  // Fetch active addendum rent for this lease
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: addendumData } = await supabase
    .from("rp_addendums")
    .select("additional_rent_amount, effective_from, effective_to")
    .eq("lease_id", lease!.id)
    .eq("status", "signed")
    .lte("effective_from", todayStr);

  const activeAddendumRent = (addendumData ?? [])
    .filter((a) => !a.effective_to || a.effective_to >= todayStr)
    .reduce((sum, a) => sum + Number(a.additional_rent_amount ?? 0), 0);

  // Display amount: base monthly rent + active addendum adjustments
  const displayAmount = Number(lease?.monthly_rent ?? 0) + activeAddendumRent;

  let landlordEmail = "";
  if (property?.landlord_id) {
    const { data: ll } = await supabase
      .from("rp_users")
      .select("email")
      .eq("id", property.landlord_id)
      .single();
    landlordEmail = ll?.email ?? "";
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
          Financial Overview
        </h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">
          {property?.address_line1}, {property?.city}, {property?.province_state}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Balance Summary */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-ambient-sm flex flex-col justify-between border-l-4 border-secondary">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {isLeaseEnded ? "Lease Status" : "Current Balance"}
            </span>

            {isLeaseEnded ? (
              <div className="mt-4">
                <p className="text-lg font-bold text-on-surface-variant">No rent due</p>
                <p className="text-xs text-on-surface-variant mt-1">Lease has ended</p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-sm font-bold text-secondary">{currency}</span>
                  <h3 className="text-3xl md:text-4xl font-headline font-black text-primary tracking-tighter">
                    {formatCurrency(isLeaseUpcoming ? displayAmount : currentBalance, currency)}
                  </h3>
                </div>
                {activeAddendumRent > 0 && (
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Includes {formatCurrency(activeAddendumRent, currency)} addendum
                  </p>
                )}
                {isLeaseUpcoming ? (
                  <p className="text-xs text-on-surface-variant mt-1">
                    First rent due:{" "}
                    <DateDisplay
                      date={nextDue?.due_date ?? lease!.start_date}
                      format="medium"
                    />
                  </p>
                ) : nextDue ? (
                  <div className="mt-1">
                    <p className="text-xs text-on-surface-variant">
                      Due: <DateDisplay date={nextDue.due_date} format="medium" />
                    </p>
                    <RentCountdown dueDate={nextDue.due_date} className="mt-1" />
                  </div>
                ) : null}
              </>
            )}
          </div>
          <div className="mt-6 h-16 w-full flex items-end gap-1">
            {(rentSchedule ?? []).slice(0, 6).map((r, i) => (
              <div
                key={r.id}
                className={`flex-1 rounded-t-sm ${
                  r.status === "upcoming" ? "bg-surface-container-high" :
                  r.status === "due" ? "bg-secondary" :
                  r.status === "overdue" ? "bg-error" : "bg-primary-container"
                }`}
                style={{ height: `${40 + ((i * 15) % 60)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Pay Rent Section */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-ambient-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-headline font-bold text-primary">Pay Rent</h4>
            <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[10px] font-bold uppercase tracking-wider">
              Secure Payment
            </span>
          </div>

          <PayRentSection
            displayAmount={displayAmount}
            currency={currency}
            surcharge={surcharge}
            leaseId={lease!.id}
            landlordEmail={landlordEmail}
            propertyAddress={`${property?.address_line1}, ${property?.city}`}
            dueDateLabel={
              nextDue
                ? new Date(nextDue.due_date).toLocaleDateString("en-CA", {
                    month: "long",
                    year: "numeric",
                    timeZone: "America/Edmonton",
                  })
                : "Rent"
            }
            isLeaseEnded={isLeaseEnded}
          />
        </div>

        {/* Transaction History */}
        <div className="col-span-12">
          <h4 className="text-2xl font-headline font-extrabold text-primary tracking-tight mb-6">
            {(payments ?? []).length > 0 ? "Transaction History" : "Rent Schedule"}
          </h4>

          {/* Mobile: card layout */}
          <div className="block md:hidden space-y-3">
            {(payments ?? []).length > 0
              ? (payments ?? []).map((p) => (
                  <div key={p.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient-sm border-l-4 border-secondary">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold text-primary">Rent Payment</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(Number(p.total_charged ?? p.amount), currency)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <DateDisplay date={p.created_at} format="medium" className="text-xs text-on-surface-variant" />
                      <PaymentMethodBadge method={p.payment_method ?? "etransfer"} />
                    </div>
                  </div>
                ))
              : (rentSchedule ?? []).map((r) => (
                  <div key={r.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient-sm border-l-4 border-secondary">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold text-primary">Monthly Rent</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(Number(r.amount_due), currency)}</p>
                    <DateDisplay date={r.due_date} format="medium" className="text-xs text-on-surface-variant mt-1 block" />
                  </div>
                ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-surface-container-low shadow-ambient-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high">
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="bg-surface-container-lowest">
                {(payments ?? []).length > 0
                  ? (payments ?? []).map((p) => (
                      <tr key={p.id} className="hover:bg-surface-bright transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap border-l-4 border-secondary">
                          <DateDisplay date={p.created_at} format="medium" className="text-sm font-bold text-primary" />
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-primary">Rent Payment</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-bold text-primary">{formatCurrency(Number(p.total_charged ?? p.amount), currency)}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))
                  : (rentSchedule ?? []).map((r) => (
                      <tr key={r.id} className="hover:bg-surface-bright transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap border-l-4 border-secondary">
                          <DateDisplay date={r.due_date} format="medium" className="text-sm font-bold text-primary" />
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-primary">Monthly Rent - {property?.address_line1}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-bold text-primary">{formatCurrency(Number(r.amount_due), currency)}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
