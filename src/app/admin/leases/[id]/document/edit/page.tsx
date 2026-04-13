import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { LeaseDocumentEditor } from "@/components/forms/lease-document-editor";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";

/**
 * Fallback editing route for leases without rp_lease_documents rows.
 * Uses the old monolithic rp_leases.lease_document_content column directly.
 * This route will be less used as data migrates to the new table.
 */
export default async function LeaseDocumentEditFallbackPage({
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
    .select("id, first_name, last_name, email, phone")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser) redirect("/admin/dashboard");

  const { data: lease } = await supabase
    .from("rp_leases")
    .select(
      "id, property_id, signing_status, lease_document_content, rp_properties!inner(landlord_id, address_line1, city)"
    )
    .eq("id", leaseId)
    .single();

  if (!lease) return notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = lease.rp_properties as any;
  if (property.landlord_id !== rpUser.id) return notFound();

  const propertyAddress = `${property.address_line1}, ${property.city}`;
  const documentContent = lease.lease_document_content as LeaseDocumentContent | null;
  const signingStatus = (lease.signing_status as string) ?? "draft";
  const isReadOnly =
    signingStatus === "sent" ||
    signingStatus === "partially_signed" ||
    signingStatus === "completed";

  // Fetch tenants
  const { data: leaseTenants } = await supabase
    .from("rp_lease_tenants")
    .select(
      "rp_users!inner(id, first_name, last_name, email, phone, id_document_status)"
    )
    .eq("lease_id", leaseId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenants = (leaseTenants ?? []).map((lt) => lt.rp_users as any);

  const { data: propertyOwners } = await supabase
    .from("rp_property_owners")
    .select("designation, rp_users!inner(first_name, last_name, email)")
    .eq("property_id", lease.property_id)
    .in("designation", ["owner", "signing_authority"]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landlordRecipients =
    propertyOwners && propertyOwners.length > 0
      ? propertyOwners.map((po: any, i: number) => ({
          name: `${po.rp_users.first_name} ${po.rp_users.last_name}`,
          email: po.rp_users.email,
          role: "landlord" as const,
          signingOrder: tenants.length + i + 1,
        }))
      : [
          {
            name: `${rpUser.first_name} ${rpUser.last_name}`,
            email: rpUser.email,
            role: "landlord" as const,
            signingOrder: tenants.length + 1,
          },
        ];

  const recipients = [
    ...tenants.map((t: any, i: number) => ({
      name: `${t.first_name} ${t.last_name}`,
      email: t.email,
      role: "tenant" as const,
      signingOrder: i + 1,
    })),
    ...landlordRecipients,
  ];

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
          {
            label: "Documents",
            href: `/admin/leases/${leaseId}/document`,
          },
          { label: "Lease Agreement" },
        ]}
      />

      <LeaseDocumentEditor
        leaseId={leaseId}
        propertyId={lease.property_id}
        documentContent={documentContent}
        signingStatus={signingStatus}
        isReadOnly={isReadOnly}
        propertyAddress={propertyAddress}
        tenantCount={tenants.length}
        hasUnverifiedTenants={tenants.some(
          (t: any) => t.id_document_status !== "approved"
        )}
        recipients={recipients}
        parentUrl={`/admin/leases/${leaseId}/document`}
      />
    </section>
  );
}
