import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";

export default async function AdminSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select(
      "id, first_name, last_name, email, phone, notification_email, notification_sms, notification_push, timezone, preferred_currency"
    )
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // ─── Fetch landlord profile with plan ───
  const { data: landlordProfile } = await supabase
    .from("rp_landlord_profiles")
    .select(
      "id, company_name, business_number, currency_code, property_count, subscription_status, trial_ends_at, current_period_start, current_period_end, stripe_connect_account_id, stripe_customer_id, plan_id, rp_plans(id, slug, name, min_properties, max_properties, per_unit_price, card_surcharge_percent, features, sort_order)"
    )
    .eq("user_id", rpUser.id)
    .single();

  const planRaw = landlordProfile?.rp_plans;
  const plan = (Array.isArray(planRaw) ? planRaw[0] : planRaw) as {
    id: string;
    slug: string;
    name: string;
    min_properties: number | null;
    max_properties: number | null;
    per_unit_price: number;
    card_surcharge_percent: number;
    features: string[] | null;
    sort_order: number;
  } | null;

  const stripeConnected = !!landlordProfile?.stripe_connect_account_id;
  const stripeAccountPreview = landlordProfile?.stripe_connect_account_id
    ? `${landlordProfile.stripe_connect_account_id.substring(0, 12)}...`
    : null;

  return (
    <section className="space-y-8">
      {/* ─── Header ─── */}
      <h1 className="font-headline text-2xl font-bold text-primary">
        Settings
      </h1>

      {/* ─── Profile Section ─── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">person</span>
          <h3 className="font-headline font-bold text-lg">Profile</h3>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Full Name
              </p>
              <p className="text-sm font-medium text-on-surface">
                {rpUser.first_name} {rpUser.last_name}
              </p>
            </div>
            {/* Email */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Email
              </p>
              <p className="text-sm font-medium text-on-surface">
                {rpUser.email}
              </p>
            </div>
            {/* Phone */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Phone
              </p>
              <p className="text-sm font-medium text-on-surface">
                {rpUser.phone || "Not provided"}
              </p>
            </div>
            {/* Company Name */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Company Name
              </p>
              <p className="text-sm font-medium text-on-surface">
                {landlordProfile?.company_name || "Not set"}
              </p>
            </div>
            {/* Business Number */}
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Business Number
              </p>
              <p className="text-sm font-medium text-on-surface">
                {landlordProfile?.business_number || "Not set"}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ─── Subscription & Plan Section ─── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            credit_card
          </span>
          <h3 className="font-headline font-bold text-lg">
            Subscription & Plan
          </h3>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          {plan ? (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h4 className="font-headline font-bold text-xl text-on-surface">
                  {plan.name}
                </h4>
                <StatusBadge status={plan.slug} />
                <StatusBadge
                  status={landlordProfile?.subscription_status ?? "free"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Per-unit price */}
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                    Per-unit Price
                  </p>
                  <p className="text-lg font-extrabold font-headline text-primary">
                    {formatCurrency(
                      plan.per_unit_price,
                      landlordProfile?.currency_code ?? "CAD"
                    )}
                    <span className="text-xs text-on-surface-variant font-normal">
                      {" "}
                      / unit / mo
                    </span>
                  </p>
                </div>
                {/* Max properties */}
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                    Property Limit
                  </p>
                  <p className="text-lg font-extrabold font-headline text-on-surface">
                    {plan.max_properties ?? "Unlimited"}
                  </p>
                </div>
                {/* Card surcharge */}
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                    Card Surcharge
                  </p>
                  <p className="text-lg font-extrabold font-headline text-on-surface">
                    {plan.card_surcharge_percent}%
                  </p>
                </div>
              </div>

              {/* Current period */}
              {landlordProfile?.current_period_start && (
                <div className="bg-surface-container-low rounded-xl px-5 py-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                        Current Period
                      </p>
                      <p className="text-sm font-medium text-on-surface flex items-center gap-2">
                        <DateDisplay
                          date={landlordProfile.current_period_start}
                          format="medium"
                        />
                        <span className="text-on-surface-variant">to</span>
                        <DateDisplay
                          date={
                            landlordProfile.current_period_end ??
                            landlordProfile.current_period_start
                          }
                          format="medium"
                        />
                      </p>
                    </div>
                    {landlordProfile?.trial_ends_at && (
                      <div>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                          Trial Ends
                        </p>
                        <p className="text-sm font-medium text-secondary">
                          <DateDisplay
                            date={landlordProfile.trial_ends_at}
                            format="medium"
                          />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                    Properties Used
                  </p>
                  <p className="text-xs font-semibold text-on-surface-variant">
                    {landlordProfile?.property_count ?? 0} /{" "}
                    {plan.max_properties ?? "Unlimited"}
                  </p>
                </div>
                {plan.max_properties && (
                  <div className="overflow-hidden h-2.5 rounded-full bg-surface-container-high">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((landlordProfile?.property_count ?? 0) /
                              plan.max_properties) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-3">
                    Plan Features
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {plan.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-on-surface"
                      >
                        <span className="material-symbols-outlined text-tertiary text-lg">
                          check_circle
                        </span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    swap_horiz
                  </span>
                  Change Plan
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
                credit_card_off
              </span>
              <p className="text-sm text-on-surface-variant mb-4">
                No plan selected
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
              >
                View Plans
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stripe Connect Section ─── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            account_balance
          </span>
          <h3 className="font-headline font-bold text-lg">
            Stripe Connect
          </h3>
        </div>
        <div className="p-6 md:p-8 space-y-4">
          <p className="text-sm text-on-surface-variant">
            TenantPorch uses Stripe Destination Charges to process rent payments.
            Funds are deposited directly to your connected Stripe account after
            platform fees are deducted.
          </p>

          {stripeConnected ? (
            <div className="bg-surface-container-low rounded-xl px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-tertiary" />
                <span className="text-sm font-semibold text-on-surface">
                  Connected
                </span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-0.5">
                  Account ID
                </p>
                <p className="text-sm font-mono text-on-surface-variant">
                  {stripeAccountPreview}
                </p>
              </div>
              <div className="ml-auto">
                <StatusBadge status="active" />
              </div>
            </div>
          ) : (
            <div className="bg-secondary-fixed/10 rounded-xl px-5 py-6 text-center">
              <span className="material-symbols-outlined text-secondary text-4xl mb-3 block">
                link_off
              </span>
              <p className="text-sm font-semibold text-on-surface mb-1">
                Stripe account not connected
              </p>
              <p className="text-xs text-on-surface-variant mb-4">
                Connect your Stripe account to start receiving rent payments
                directly.
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-semibold shadow-ambient-sm hover:bg-secondary-container hover:text-on-secondary-container transition-colors"
              >
                <span className="material-symbols-outlined text-lg">link</span>
                Connect Stripe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Notification Preferences ─── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            notifications
          </span>
          <h3 className="font-headline font-bold text-lg">
            Notification Preferences
          </h3>
        </div>
        <div className="p-6 md:p-8 space-y-5">
          {/* Email notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">
                email
              </span>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  Email Notifications
                </p>
                <p className="text-xs text-on-surface-variant">
                  Receive updates via email
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                rpUser.notification_email
                  ? "bg-tertiary justify-end"
                  : "bg-surface-container-high justify-start"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full shadow-ambient-sm ${
                  rpUser.notification_email
                    ? "bg-on-tertiary"
                    : "bg-on-surface-variant"
                }`}
              />
            </div>
          </div>

          {/* SMS notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">
                sms
              </span>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  SMS Notifications
                </p>
                <p className="text-xs text-on-surface-variant">
                  Receive updates via text message
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                rpUser.notification_sms
                  ? "bg-tertiary justify-end"
                  : "bg-surface-container-high justify-start"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full shadow-ambient-sm ${
                  rpUser.notification_sms
                    ? "bg-on-tertiary"
                    : "bg-on-surface-variant"
                }`}
              />
            </div>
          </div>

          {/* Push notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">
                phone_android
              </span>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  Push Notifications
                </p>
                <p className="text-xs text-on-surface-variant">
                  Receive push notifications on your devices
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                rpUser.notification_push
                  ? "bg-tertiary justify-end"
                  : "bg-surface-container-high justify-start"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full shadow-ambient-sm ${
                  rpUser.notification_push
                    ? "bg-on-tertiary"
                    : "bg-on-surface-variant"
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Update Preferences
            </button>
          </div>
        </div>
      </div>

      {/* ─── Currency & Timezone ─── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            language
          </span>
          <h3 className="font-headline font-bold text-lg">
            Currency & Timezone
          </h3>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Preferred Currency
              </p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  attach_money
                </span>
                <p className="text-sm font-medium text-on-surface">
                  {rpUser.preferred_currency ?? landlordProfile?.currency_code ?? "CAD"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Timezone
              </p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  schedule
                </span>
                <p className="text-sm font-medium text-on-surface">
                  {rpUser.timezone ?? "America/Edmonton"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Update
            </button>
          </div>
        </div>
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-error-container flex items-center gap-3">
          <span className="material-symbols-outlined text-on-error-container">
            warning
          </span>
          <h3 className="font-headline font-bold text-lg text-on-error-container">
            Danger Zone
          </h3>
        </div>
        <div className="p-6 md:p-8 space-y-4">
          <p className="text-sm text-on-surface-variant">
            Cancelling your subscription will disable all paid features at the
            end of your current billing period. Your data will be retained for 90
            days. Active leases and tenant access will continue during the
            retention period.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-error text-on-error text-sm font-semibold shadow-ambient-sm hover:bg-error-container hover:text-on-error-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">cancel</span>
            Cancel Subscription
          </button>
        </div>
      </div>
    </section>
  );
}
