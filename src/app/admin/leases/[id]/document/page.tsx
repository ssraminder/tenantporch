import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { LeaseDocumentEditor } from "@/components/forms/lease-document-editor";
import { AdditionalDocumentsSection } from "@/components/forms/additional-documents-section";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";
import { getLeaseDocuments } from "@/lib/lease-documents";

export default async function LeaseDocumentPage({
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

  // Fetch lease with property ownership check
  const { data: lease } = await supabase
    .from("rp_leases")
    .select(
      "id, property_id, lease_type, start_date, end_date, monthly_rent, currency_code, security_deposit, deposit_paid_date, utility_split_percent, internet_included, pad_enabled, pets_allowed, smoking_allowed, max_occupants, late_fee_type, late_fee_amount, status, signing_status, lease_document_content, rp_properties!inner(landlord_id, address_line1, address_line2, city, province_state, postal_code, unit_description, parking_type, parking_spots, laundry_type, storage_included, yard_access, has_separate_entrance)"
    )
    .eq("id", leaseId)
    .single();

  if (!lease) return <NotFound />;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = lease.rp_properties as any;
  if (property.landlord_id !== rpUser.id) return <NotFound />;

  // Fetch tenants on this lease
  const { data: leaseTenants } = await supabase
    .from("rp_lease_tenants")
    .select(
      "rp_users!inner(id, first_name, last_name, email, phone, id_type, id_number, id_place_of_issue, id_expiry_date, id_name_on_document, id_document_status)"
    )
    .eq("lease_id", leaseId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenants = (leaseTenants ?? []).map((lt) => lt.rp_users as any);

  // Use stored document content
  const documentContent = lease.lease_document_content as LeaseDocumentContent | null;

  // Fetch additional documents from rp_lease_documents
  const leaseDocuments = await getLeaseDocuments(supabase, leaseId);

  // Detect if document has stale/missing tenant data
  const tenantNames = tenants.map((t: any) => `${t.first_name} ${t.last_name}`);
  const partiesTenantText = documentContent?.sections
    ?.find((s) => s.id === "parties")
    ?.clauses?.find((c) => c.id === "parties-tenant")?.text ?? "";
  const tenantDataStale = tenants.length > 0 && !tenantNames.some((name: string) => partiesTenantText.includes(name));

  const signingStatus = (lease.signing_status as string) ?? "draft";
  const isReadOnly = signingStatus === "sent" || signingStatus === "partially_signed" || signingStatus === "completed";

  // Fetch property owners (owners + signing authorities) for recipients
  const { data: propertyOwners } = await supabase
    .from("rp_property_owners")
    .select("designation, rp_users!inner(first_name, last_name, email)")
    .eq("property_id", lease.property_id)
    .in("designation", ["owner", "signing_authority"]);

  // Build recipients list for signing preview modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landlordRecipients = propertyOwners && propertyOwners.length > 0
    ? propertyOwners.map((po: any, i: number) => ({
        name: `${po.rp_users.first_name} ${po.rp_users.last_name}`,
        email: po.rp_users.email,
        role: "landlord" as const,
        signingOrder: tenants.length + i + 1,
      }))
    : [{
        name: `${rpUser.first_name} ${rpUser.last_name}`,
        email: rpUser.email,
        role: "landlord" as const,
        signingOrder: tenants.length + 1,
      }];

  const recipients = [
    ...tenants.map((t: any, i: number) => ({
      name: `${t.first_name} ${t.last_name}`,
      email: t.email,
      role: "tenant" as const,
      signingOrder: i + 1,
    })),
    ...landlordRecipients,
  ];

  // Fetch email logs if a signing request exists
  let emailLogs: any[] = [];
  if (signingStatus !== "draft") {
    const { data: signingRequest } = await supabase
      .from("rp_signing_requests")
      .select("id")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (signingRequest) {
      const { data: logs } = await supabase
        .from("rp_email_logs")
        .select(
          "id, recipient_email, recipient_name, email_type, status, sent_at, participant_id, resend_message_id"
        )
        .eq("signing_request_id", signingRequest.id)
        .order("sent_at", { ascending: false });

      emailLogs = logs ?? [];
    }
  }

  // Fetch signed document URL if completed
  let signedDocumentUrl: string | null = null;
  if (signingStatus === "completed") {
    const { data: signedDoc } = await supabase
      .from("rp_documents")
      .select("file_url")
      .eq("lease_id", leaseId)
      .eq("category", "lease")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    signedDocumentUrl = signedDoc?.file_url ?? null;
  }

  return (
    <section className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Properties", href: "/admin/properties", icon: "apartment" },
          { label: property.address_line1, href: `/admin/properties/${lease.property_id}` },
          { label: "Lease Document" },
        ]}
      />

      <LeaseDocumentEditor
        leaseId={leaseId}
        propertyId={lease.property_id}
        documentContent={documentContent}
        signingStatus={signingStatus}
        isReadOnly={isReadOnly}
        propertyAddress={`${property.address_line1}, ${property.city}`}
        tenantCount={tenants.length}
        hasUnverifiedTenants={tenants.some(
          (t: any) => t.id_document_status !== "approved"
        )}
        tenantDataStale={tenantDataStale}
        recipients={recipients}
        emailLogs={emailLogs}
        signedDocumentUrl={signedDocumentUrl}
      />

      <AdditionalDocumentsSection
        leaseId={leaseId}
        documents={leaseDocuments}
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
          description
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
