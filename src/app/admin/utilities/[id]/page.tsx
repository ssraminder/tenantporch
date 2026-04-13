import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { DateDisplay } from "@/components/shared/date-display";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { UtilityBillActions } from "@/components/forms/utility-bill-actions";

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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  etransfer: "E-Transfer",
  card: "Credit Card",
  cash: "Cash",
  cheque: "Cheque",
};

export default async function UtilityBillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: billId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id, first_name, last_name, email")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser) redirect("/admin/dashboard");

  // Fetch the bill
  const { data: bill } = await supabase
    .from("rp_utility_bills")
    .select(
      "id, property_id, lease_id, billing_period, utility_type, total_amount, currency_code, split_percent, tenant_amount, landlord_amount, due_date, status, sent_at, reminder_sent_at, payment_method, paid_at, etransfer_reference, file_urls, notes, created_at"
    )
    .eq("id", billId)
    .single();

  if (!bill) notFound();

  // Verify ownership
  const { data: property } = await supabase
    .from("rp_properties")
    .select("id, address_line1, city, province_state, landlord_id")
    .eq("id", bill.property_id)
    .single();

  if (!property || (property as any).landlord_id !== rpUser.id) notFound();

  // Fetch tenants on the lease
  const { data: leaseTenants } = await supabase
    .from("rp_lease_tenants")
    .select("rp_users!inner(first_name, last_name, email)")
    .eq("lease_id", bill.lease_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenants = (leaseTenants ?? []).map((lt) => lt.rp_users as any);

  const utilityLabel = UTILITY_LABELS[bill.utility_type] ?? bill.utility_type;
  const icon = UTILITY_ICONS[bill.utility_type] ?? "category";
  const statusStyle = STATUS_STYLES[bill.status] ?? STATUS_STYLES.draft;
  const statusLabel = STATUS_LABELS[bill.status] ?? bill.status;
  const currency = bill.currency_code ?? "CAD";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileUrls = (bill.file_urls as any[]) ?? [];

  // Determine if reminder can be sent (>3 days since sent)
  const canSendReminder = (() => {
    if (bill.status !== "sent" && bill.status !== "overdue") return false;
    if (!bill.sent_at) return true;
    const sentDate = new Date(bill.sent_at);
    const daysSinceSent = (Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSent >= 3;
  })();

  return (
    <section className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Utilities", href: "/admin/utilities", icon: "bolt" },
          { label: `${utilityLabel} Bill` },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-secondary text-2xl">{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-2xl font-extrabold text-primary">
                {utilityLabel}
              </h1>
              {bill.billing_period && (
                <span className="text-on-surface-variant text-base font-medium">
                  — {bill.billing_period}
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {property.address_line1}, {property.city}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold ${statusStyle}`}>
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Amount breakdown */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6">
            <h2 className="font-headline font-bold text-base text-on-surface mb-4">Bill Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                <span className="text-sm text-on-surface-variant">Total bill</span>
                <span className="text-sm font-bold text-on-surface">
                  {formatCurrency(Number(bill.total_amount), currency)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                <span className="text-sm text-on-surface-variant">
                  Tenant share ({bill.split_percent}%)
                </span>
                <span className="text-base font-extrabold text-primary">
                  {formatCurrency(Number(bill.tenant_amount), currency)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-on-surface-variant">
                  Landlord covers ({100 - bill.split_percent}%)
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {formatCurrency(Number(bill.landlord_amount), currency)}
                </span>
              </div>
              {bill.due_date && (
                <div className="flex items-center justify-between py-2 border-t border-outline-variant/10">
                  <span className="text-sm text-on-surface-variant">Due date</span>
                  <DateDisplay
                    date={bill.due_date}
                    format="medium"
                    className={`text-sm font-bold ${bill.status === "overdue" ? "text-error" : "text-on-surface"}`}
                  />
                </div>
              )}
            </div>

            {/* Split bar */}
            {bill.split_percent > 0 && (
              <div className="mt-4 pt-4 border-t border-outline-variant/10">
                <div className="overflow-hidden h-2.5 rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary-fixed-dim"
                    style={{ width: `${bill.split_percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>Tenant: {bill.split_percent}%</span>
                  <span>Landlord: {100 - bill.split_percent}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded bills */}
          {fileUrls.length > 0 && (
            <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6">
              <h2 className="font-headline font-bold text-base text-on-surface mb-4">
                Uploaded Bills
              </h2>
              <div className="space-y-2">
                {fileUrls.map((f: any, i: number) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-secondary text-lg">
                      {f.name?.endsWith(".pdf") ? "picture_as_pdf" : "image"}
                    </span>
                    <p className="text-sm text-on-surface flex-1 truncate">{f.name}</p>
                    {f.size && (
                      <p className="text-xs text-on-surface-variant flex-shrink-0">
                        {(f.size / 1024).toFixed(0)} KB
                      </p>
                    )}
                    <span className="material-symbols-outlined text-outline-variant text-sm flex-shrink-0">
                      open_in_new
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {bill.notes && (
            <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6">
              <h2 className="font-headline font-bold text-base text-on-surface mb-2">Notes</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{bill.notes}</p>
            </div>
          )}

          {/* Tenants */}
          {tenants.length > 0 && (
            <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6">
              <h2 className="font-headline font-bold text-base text-on-surface mb-4">Billed To</h2>
              <div className="space-y-2">
                {tenants.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {t.first_name} {t.last_name}
                      </p>
                      <p className="text-xs text-on-surface-variant">{t.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: actions + timeline */}
        <div className="space-y-5">

          {/* Payment info when paid */}
          {bill.status === "paid" && (
            <div className="bg-tertiary-container/30 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                <h3 className="font-headline font-bold text-base text-on-surface">Payment Confirmed</h3>
              </div>
              {bill.paid_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Paid on</span>
                  <DateDisplay date={bill.paid_at} format="medium" className="font-semibold text-on-surface" />
                </div>
              )}
              {bill.payment_method && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Method</span>
                  <span className="font-semibold text-on-surface">
                    {PAYMENT_METHOD_LABELS[bill.payment_method] ?? bill.payment_method}
                  </span>
                </div>
              )}
              {bill.etransfer_reference && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Reference</span>
                  <span className="font-semibold text-on-surface font-mono text-xs">
                    {bill.etransfer_reference}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Interactive actions */}
          <UtilityBillActions
            billId={billId}
            status={bill.status}
            canSendReminder={canSendReminder}
            tenantAmount={formatCurrency(Number(bill.tenant_amount), currency)}
          />

          {/* Timeline */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-5">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">Activity</h3>
            <div className="space-y-3">
              <TimelineItem
                icon="add_circle"
                label="Bill created"
                date={bill.created_at}
                color="text-on-surface-variant"
              />
              {bill.sent_at && (
                <TimelineItem
                  icon="send"
                  label="Sent to tenant"
                  date={bill.sent_at}
                  color="text-primary"
                />
              )}
              {bill.reminder_sent_at && (
                <TimelineItem
                  icon="notifications"
                  label="Reminder sent"
                  date={bill.reminder_sent_at}
                  color="text-secondary"
                />
              )}
              {bill.paid_at && (
                <TimelineItem
                  icon="check_circle"
                  label="Payment recorded"
                  date={bill.paid_at}
                  color="text-tertiary"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  color,
}: {
  icon: string;
  label: string;
  date: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`material-symbols-outlined text-lg flex-shrink-0 ${color}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface">{label}</p>
        <DateDisplay date={date} format="medium" className="text-xs text-on-surface-variant" />
      </div>
    </div>
  );
}
