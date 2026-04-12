import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DepositRefundWizard } from "./deposit-refund-wizard";

export default async function DepositRefundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leaseId } = await params;
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

  // Fetch lease with property info and verify ownership
  const { data: lease } = await supabase
    .from("rp_leases")
    .select(
      "id, property_id, status, rp_properties!inner(landlord_id, address_line1, city)"
    )
    .eq("id", leaseId)
    .single();

  if (!lease) return <NotFound />;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = lease.rp_properties as any;
  if (property.landlord_id !== rpUser.id) return <NotFound />;

  // Fetch security deposit (held)
  const { data: deposit } = await supabase
    .from("rp_security_deposits")
    .select(
      "id, amount, interest_accrued, received_date, currency_code, status"
    )
    .eq("lease_id", leaseId)
    .eq("status", "held")
    .maybeSingle();

  // Fetch tenant info
  const { data: leaseTenants } = await supabase
    .from("rp_lease_tenants")
    .select("rp_users!inner(first_name, last_name, email)")
    .eq("lease_id", leaseId)
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenant = leaseTenants?.[0]?.rp_users
    ? (leaseTenants[0].rp_users as any)
    : null;

  const propertyAddress = `${property.address_line1}, ${property.city}`;

  // If no deposit on file
  if (!deposit) {
    return (
      <section className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
            {
              label: "Properties",
              href: "/admin/properties",
              icon: "apartment",
            },
            {
              label: property.address_line1,
              href: `/admin/properties/${lease.property_id}`,
            },
            { label: "Deposit Refund" },
          ]}
        />

        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-8 md:p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
            savings
          </span>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">
            No Security Deposit on File
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
            There is no held security deposit for this lease at{" "}
            {propertyAddress}. A deposit record must exist before you can process
            a refund.
          </p>
          <Link
            href={`/admin/properties/${lease.property_id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Back to Property
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Properties", href: "/admin/properties", icon: "apartment" },
          {
            label: property.address_line1,
            href: `/admin/properties/${lease.property_id}`,
          },
          { label: "Deposit Refund" },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
          Deposit Refund
        </h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">
          Process a security deposit return for {propertyAddress}
        </p>
      </div>

      <DepositRefundWizard
        lease={{
          id: lease.id,
          property_id: lease.property_id,
          rp_properties: {
            address_line1: property.address_line1,
            city: property.city,
          },
        }}
        deposit={{
          id: deposit.id,
          amount: Number(deposit.amount),
          interest_accrued: Number(deposit.interest_accrued ?? 0),
          received_date: deposit.received_date,
          currency_code: deposit.currency_code,
        }}
        tenant={tenant}
      />
    </section>
  );
}

function NotFound() {
  return (
    <section className="space-y-8">
      <Link
        href="/admin/properties"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Properties
      </Link>
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
          gavel
        </span>
        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          Lease Not Found
        </h2>
        <p className="text-on-surface-variant">
          This lease doesn&apos;t exist or doesn&apos;t belong to your account.
        </p>
      </div>
    </section>
  );
}
