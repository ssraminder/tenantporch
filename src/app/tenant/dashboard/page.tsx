import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { RentCountdown } from "@/components/shared/rent-countdown";

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

export default async function TenantDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile
  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id, first_name, last_name, email")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // Fetch lease via rp_lease_tenants — include active and draft (upcoming) leases
  const { data: leaseLinks } = await supabase
    .from("rp_lease_tenants")
    .select("lease_id, rp_leases!inner(id, status)")
    .eq("user_id", rpUser.id)
    .in("rp_leases.status", ["active", "draft"]);

  // Pick the first active lease, or fall back to draft
  const sortedLinks = (leaseLinks ?? []).sort((a, b) => {
    const aStatus = (a as any).rp_leases?.status ?? "";
    const bStatus = (b as any).rp_leases?.status ?? "";
    if (aStatus === "active" && bStatus !== "active") return -1;
    if (bStatus === "active" && aStatus !== "active") return 1;
    return 0;
  });
  const leaseLink = sortedLinks[0] ?? null;

  let lease = null;
  let property = null;
  let currentRent = null;

  if (leaseLink) {
    const { data: leaseData } = await supabase
      .from("rp_leases")
      .select("*")
      .eq("id", leaseLink.lease_id)
      .single();
    lease = leaseData;

    if (lease) {
      const { data: propData } = await supabase
        .from("rp_properties")
        .select("*")
        .eq("id", lease.property_id)
        .single();
      property = propData;

      // Get the next upcoming or due rent
      const { data: rentData } = await supabase
        .from("rp_rent_schedule")
        .select("*")
        .eq("lease_id", lease.id)
        .in("status", ["upcoming", "due", "overdue", "partial"])
        .order("due_date", { ascending: true })
        .limit(1)
        .single();
      currentRent = rentData;
    }
  }

  // Fetch last 5 notifications
  const { data: notifications } = await supabase
    .from("rp_notifications")
    .select("*")
    .eq("user_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate lease countdown
  const daysRemaining = lease
    ? Math.ceil(
        (new Date(lease.end_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;
  const totalDays = lease
    ? Math.ceil(
        (new Date(lease.end_date).getTime() -
          new Date(lease.start_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 1;
  const leaseProgress = lease
    ? Math.min(100, Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100)))
    : 0;

  const address = property
    ? `${property.address_line1}${property.address_line2 ? `, ${property.address_line2}` : ""}, ${property.city}, ${property.province_state} ${property.postal_code}`
    : "";

  // Rent status
  const rentStatus = currentRent?.status ?? "upcoming";
  const rentStatusLabel =
    rentStatus === "upcoming"
      ? "Upcoming"
      : rentStatus === "due"
        ? "Due"
        : rentStatus === "overdue"
          ? "Overdue"
          : rentStatus === "partial"
            ? "Partial"
            : "Settled";

  // Contextual lease label
  const now = new Date();
  const leaseStartDate = lease ? new Date(lease.start_date) : null;
  const leaseEndDate = lease ? new Date(lease.end_date) : null;
  const leaseNotStarted = leaseStartDate && leaseStartDate > now;
  const leaseEnded = leaseEndDate && leaseEndDate < now;
  const leaseLabel = leaseNotStarted
    ? "Upcoming Lease"
    : leaseEnded
      ? "Lease Ended"
      : "Current Residence";

  return (
    <section className="space-y-8">
      {/* Hero + Rent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-primary text-white p-8 md:p-10 flex flex-col justify-end min-h-[240px] md:min-h-[320px] shadow-ambient-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary opacity-80" />
          <div className="relative z-10">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${
              leaseNotStarted
                ? "bg-primary-fixed/20 text-primary-fixed"
                : leaseEnded
                  ? "bg-error-container/20 text-error-container"
                  : "bg-secondary-fixed/20 text-secondary-fixed"
            }`}>
              {leaseLabel}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline mb-2">
              Welcome{leaseEnded ? "" : " home"}, {rpUser.first_name}
            </h2>
            {property && (
              <p className="text-blue-100 text-base md:text-lg opacity-80 flex items-center gap-2">
                <span className="material-symbols-outlined">apartment</span>
                {address}
              </p>
            )}
            {leaseNotStarted && leaseStartDate && (
              <p className="text-blue-100 text-sm opacity-70 mt-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">event</span>
                Lease starts <DateDisplay date={leaseStartDate} format="medium" /> — {Math.ceil((leaseStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days away
              </p>
            )}
            {leaseEnded && leaseEndDate && (
              <p className="text-blue-100 text-sm opacity-70 mt-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">event_busy</span>
                Lease ended <DateDisplay date={leaseEndDate} format="medium" />
              </p>
            )}
          </div>
        </div>

        {/* Rent Status Card */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 md:p-8 flex flex-col justify-between border border-outline-variant/10 shadow-ambient relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16" />
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-headline font-bold text-xl">Monthly Rent</h3>
              <StatusBadge status={rentStatusLabel} />
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-sm font-medium text-on-surface-variant">
                {lease?.currency_code ?? "CAD"}
              </span>
              <span className="text-3xl md:text-4xl font-extrabold text-primary">
                {formatCurrency(
                  Number(currentRent?.amount_due ?? lease?.monthly_rent ?? 0),
                  lease?.currency_code ?? "CAD"
                )}
              </span>
            </div>
            {currentRent && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-on-surface-variant font-medium">
                  Due:{" "}
                  <DateDisplay date={currentRent.due_date} format="medium" />
                </p>
                <span className="text-on-surface-variant">·</span>
                <RentCountdown dueDate={currentRent.due_date} />
              </div>
            )}
          </div>
          <Link
            href="/tenant/payments"
            className="mt-6 w-full py-4 bg-secondary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance_wallet
            </span>
            Pay Rent Now
          </Link>
        </div>
      </div>

      {/* Quick Actions + Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Action Grid */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          {[
            {
              icon: "history",
              title: "Payment History",
              desc: "Review past transactions and receipts",
              href: "/tenant/payments",
            },
            {
              icon: "handyman",
              title: "Maintenance",
              desc: "Request repairs or report issues",
              href: "/tenant/maintenance",
            },
            {
              icon: "gavel",
              title: "Digital Lease",
              desc: "View terms and compliance docs",
              href: "/tenant/documents",
            },
            {
              icon: "chat",
              title: "Contact Owner",
              desc: "Message your property manager",
              href: "/tenant/messages",
            },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="bg-surface-container-low p-6 rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center mb-4 shadow-ambient-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary">
                  {action.icon}
                </span>
              </div>
              <h4 className="font-bold text-primary">{action.title}</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                {action.desc}
              </p>
            </Link>
          ))}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Lease Countdown */}
          {lease && (
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/10 shadow-ambient-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-lg">
                  {leaseNotStarted ? "Lease Starts" : "Lease Remaining"}
                </h3>
                <span className="text-xs font-bold text-on-surface-variant">
                  {leaseNotStarted ? "Starts" : "Expires"}{" "}
                  <DateDisplay date={leaseNotStarted ? lease.start_date : lease.end_date} format="short" />
                </span>
              </div>
              {leaseNotStarted && leaseStartDate ? (
                <div className="text-center py-4">
                  <span className="text-4xl font-headline font-black text-primary">
                    {Math.ceil((leaseStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                  <p className="text-sm font-semibold text-on-surface-variant mt-1">days until move-in</p>
                </div>
              ) : (
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                      leaseEnded
                        ? "text-error bg-error-container"
                        : "text-secondary bg-secondary-fixed"
                    }`}>
                      {daysRemaining > 0
                        ? `${daysRemaining} Days Left`
                        : "Expired"}
                    </span>
                    <span className="text-xs font-semibold inline-block text-secondary">
                      {leaseProgress}%
                    </span>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-surface-container-high">
                    <div
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                        leaseEnded ? "bg-error" : "bg-secondary"
                      }`}
                      style={{ width: `${leaseProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Feed */}
          <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
            <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex justify-between items-center">
              <h3 className="font-headline font-bold text-lg">
                Recent Activity
              </h3>
              <Link
                href="/tenant/messages"
                className="text-xs font-bold text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {(notifications ?? []).length === 0 && (
                <div className="px-8 py-6 text-center text-sm text-on-surface-variant">
                  No recent activity
                </div>
              )}
              {(notifications ?? []).map((notif) => {
                const config = NOTIF_ICON[notif.type] ?? NOTIF_ICON.general;
                return (
                  <Link
                    key={notif.id}
                    href={notif.action_url ?? "/tenant/dashboard"}
                    className="flex items-center gap-4 px-6 md:px-8 py-4 hover:bg-surface-container-low transition-colors"
                  >
                    <div
                      className={`w-1 h-8 ${config.color} rounded-full`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        <DateDisplay
                          date={notif.created_at}
                          format="relative"
                        />
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant">
                      chevron_right
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
