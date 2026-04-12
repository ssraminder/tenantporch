"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile, updateCompanyInfo } from "@/app/admin/actions/profile-actions";
import { usePlanGate } from "@/components/shared/plan-gate-provider";

interface SettingsFormsProps {
  user: { firstName: string; lastName: string; email: string; phone?: string };
  landlordProfile: any;
  plan: any;
}

/* ────────────────────────────────────────────────────── */
/*  Profile Section                                      */
/* ────────────────────────────────────────────────────── */
export function ProfileSection({ user, landlordProfile }: Pick<SettingsFormsProps, "user" | "landlordProfile">) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const fd = new FormData();
    fd.set("first_name", firstName);
    fd.set("last_name", lastName);
    fd.set("phone", phone);

    startTransition(async () => {
      const result = await updateProfile(fd);
      if (result.success) {
        toast.success("Profile updated");
        setEditing(false);
      } else {
        toast.error(result.error ?? "Failed to update profile");
      }
    });
  }

  function handleCancel() {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? "");
    setEditing(false);
  }

  return (
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
              First Name
            </p>
            {editing ? (
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-sm font-medium text-on-surface">
                {user.firstName}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Last Name
            </p>
            {editing ? (
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-sm font-medium text-on-surface">
                {user.lastName}
              </p>
            )}
          </div>
          {/* Email (read-only) */}
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Email
            </p>
            <p className="text-sm font-medium text-on-surface">
              {user.email}
            </p>
          </div>
          {/* Phone */}
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Phone
            </p>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Not provided"
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-sm font-medium text-on-surface">
                {user.phone || "Not provided"}
              </p>
            )}
          </div>
          {/* Company Name (read-only display) */}
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Company Name
            </p>
            <p className="text-sm font-medium text-on-surface">
              {landlordProfile?.company_name || "Not set"}
            </p>
          </div>
          {/* Business Number (read-only display) */}
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
              Business Number
            </p>
            <p className="text-sm font-medium text-on-surface">
              {landlordProfile?.business_number || "Not set"}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-semibold shadow-ambient-sm hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">
                  {isPending ? "progress_activity" : "save"}
                </span>
                {isPending ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/*  Notification Preferences Section                     */
/* ────────────────────────────────────────────────────── */
export function NotificationPreferencesSection({
  initialEmail,
  initialSms,
  initialPush,
}: {
  initialEmail: boolean;
  initialSms: boolean;
  initialPush: boolean;
}) {
  const [emailNotif, setEmailNotif] = useState(initialEmail);
  const [smsNotif, setSmsNotif] = useState(initialSms);
  const [pushNotif, setPushNotif] = useState(initialPush);
  const { isAvailable, openFeatureGate } = usePlanGate();

  const smsAvailable = isAvailable("sms_notifications");

  function handleUpdate() {
    toast.success("Preferences saved");
  }

  return (
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
        <button
          type="button"
          onClick={() => setEmailNotif(!emailNotif)}
          className="flex items-center justify-between py-3 w-full text-left"
        >
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
              emailNotif
                ? "bg-tertiary justify-end"
                : "bg-surface-container-high justify-start"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full shadow-ambient-sm ${
                emailNotif
                  ? "bg-on-tertiary"
                  : "bg-on-surface-variant"
              }`}
            />
          </div>
        </button>

        {/* SMS notifications */}
        <button
          type="button"
          onClick={() => {
            if (!smsAvailable) {
              openFeatureGate("sms_notifications");
              return;
            }
            setSmsNotif(!smsNotif);
          }}
          className="flex items-center justify-between py-3 w-full text-left"
        >
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
          {smsAvailable ? (
            <div
              className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                smsNotif
                  ? "bg-tertiary justify-end"
                  : "bg-surface-container-high justify-start"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full shadow-ambient-sm ${
                  smsNotif
                    ? "bg-on-tertiary"
                    : "bg-on-surface-variant"
                }`}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-sm">lock</span>
              Add-on
            </div>
          )}
        </button>

        {/* Push notifications */}
        <button
          type="button"
          onClick={() => setPushNotif(!pushNotif)}
          className="flex items-center justify-between py-3 w-full text-left"
        >
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
              pushNotif
                ? "bg-tertiary justify-end"
                : "bg-surface-container-high justify-start"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full shadow-ambient-sm ${
                pushNotif
                  ? "bg-on-tertiary"
                  : "bg-on-surface-variant"
              }`}
            />
          </div>
        </button>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleUpdate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Update Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/*  Currency & Timezone Section                          */
/* ────────────────────────────────────────────────────── */
const CURRENCIES = ["CAD", "USD"];
const TIMEZONES = [
  "America/Edmonton",
  "America/Vancouver",
  "America/Toronto",
  "America/Winnipeg",
  "America/Halifax",
  "America/St_Johns",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

export function CurrencyTimezoneSection({
  initialCurrency,
  initialTimezone,
}: {
  initialCurrency: string;
  initialTimezone: string;
}) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [isPending, startTransition] = useTransition();

  function handleUpdate() {
    const fd = new FormData();
    fd.set("currency_code", currency);
    fd.set("timezone", timezone);

    startTransition(async () => {
      const result = await updateCompanyInfo(fd);
      if (result.success) {
        toast.success("Currency & timezone updated");
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  return (
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
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">
              {isPending ? "progress_activity" : "save"}
            </span>
            {isPending ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/*  Stripe Connect Section                               */
/* ────────────────────────────────────────────────────── */
export function StripeConnectSection({
  stripeConnected,
  stripeAccountPreview,
}: {
  stripeConnected: boolean;
  stripeAccountPreview: string | null;
}) {
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start Stripe onboarding");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Failed to connect to Stripe");
    } finally {
      setConnecting(false);
    }
  }

  return (
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
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-container">
                Active
              </span>
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
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-semibold shadow-ambient-sm hover:bg-secondary-container hover:text-on-secondary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">
                {connecting ? "progress_activity" : "link"}
              </span>
              {connecting ? "Connecting..." : "Connect Stripe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/*  Danger Zone Section                                  */
/* ────────────────────────────────────────────────────── */
export function DangerZoneSection() {
  function handleCancel() {
    toast.error("Subscription cancellation is not yet available. Please contact support.");
  }

  return (
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
          onClick={handleCancel}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-error text-on-error text-sm font-semibold shadow-ambient-sm hover:bg-error-container hover:text-on-error-container transition-colors"
        >
          <span className="material-symbols-outlined text-lg">cancel</span>
          Cancel Subscription
        </button>
      </div>
    </div>
  );
}
