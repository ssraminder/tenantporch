import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";

const SIGNING_STATUS_LABELS: Record<string, string> = {
  draft: "Not Sent",
  sent: "Awaiting Your Signature",
  partially_signed: "Partially Signed",
  completed: "Fully Signed",
  signed_offline: "Signed Offline",
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  lease_agreement: "Lease Agreement",
  schedule_a: "Schedule A",
  schedule_b: "Schedule B",
};

function formatCurrency(amount: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(
    amount
  );
}

export default async function TenantLeasePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id, email")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  const { data: leaseLinks } = await supabase
    .from("rp_lease_tenants")
    .select(
      "lease_id, role, rp_leases!inner(id, status, start_date, end_date, monthly_rent, currency_code, security_deposit, signing_status, property_id, rp_properties!inner(address_line1, address_line2, city, province_state, postal_code))"
    )
    .eq("user_id", rpUser.id)
    .in("rp_leases.status", ["active", "draft"])
    .order("rp_leases(start_date)", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const links = (leaseLinks ?? []) as any[];
  if (links.length === 0) {
    return <NoLeaseState />;
  }

  // Sort: active before draft
  links.sort((a, b) => {
    const aStatus = a.rp_leases?.status ?? "";
    const bStatus = b.rp_leases?.status ?? "";
    if (aStatus === "active" && bStatus !== "active") return -1;
    if (bStatus === "active" && aStatus !== "active") return 1;
    return 0;
  });

  const primary = links[0];
  const lease = primary.rp_leases;
  const property = lease.rp_properties;
  const display = getLeaseDisplayStatus(lease);
  const signingStatus = lease.signing_status ?? "draft";

  // Pending signing participants for this user (any active signing requests)
  const { data: participantRows } = await supabase
    .from("rp_signing_participants")
    .select(
      "id, signer_role, status, token, signing_request_id, rp_signing_requests!inner(id, status, lease_id, lease_document_id)"
    )
    .eq("signer_email", rpUser.email)
    .eq("status", "pending");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myLeaseParticipants = ((participantRows ?? []) as any[]).filter(
    (p) =>
      p.rp_signing_requests?.lease_id === lease.id &&
      ["sent", "partially_signed"].includes(p.rp_signing_requests?.status)
  );

  // Lease documents (lease agreement + schedules) — content + signing state
  const { data: leaseDocs } = await supabase
    .from("rp_lease_documents")
    .select(
      "id, document_type, title, signing_status, signed_pdf_url, signing_request_id, sort_order"
    )
    .eq("lease_id", lease.id)
    .order("sort_order");

  // Signed documents stored under rp_documents (visible_to_tenant)
  const { data: signedDocs } = await supabase
    .from("rp_documents")
    .select("id, category, title, file_url, file_size, mime_type, created_at")
    .eq("lease_id", lease.id)
    .eq("visible_to_tenant", true)
    .order("created_at", { ascending: false });

  const fullAddress = `${property.address_line1}${
    property.address_line2 ? ", " + property.address_line2 : ""
  }, ${property.city}, ${property.province_state} ${property.postal_code}`;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-primary tracking-tighter leading-tight">
          Your Lease
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">{fullAddress}</p>
      </div>

      {/* Pending signature alert */}
      {myLeaseParticipants.length > 0 && (
        <div className="bg-secondary-fixed/30 border border-secondary/30 rounded-2xl p-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-secondary text-2xl">
            edit_note
          </span>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-on-secondary-fixed-variant mb-1">
              Action Required: Sign Your Lease
            </h3>
            <p className="text-sm text-on-surface-variant mb-3">
              You have {myLeaseParticipants.length} document
              {myLeaseParticipants.length === 1 ? "" : "s"} waiting for your
              signature.
            </p>
            <div className="space-y-2">
              {myLeaseParticipants.map((p) => (
                <Link
                  key={p.id}
                  href={`/sign/${p.token}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all mr-2"
                >
                  <span className="material-symbols-outlined text-sm">
                    draw
                  </span>
                  Open signing link
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lease summary card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold text-primary">
            Tenancy Details
          </h2>
          <StatusBadge status={display.key} />
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Term
            </dt>
            <dd className="text-on-surface mt-1">
              <DateDisplay date={lease.start_date} format="medium" />
              {" → "}
              {lease.end_date ? (
                <DateDisplay date={lease.end_date} format="medium" />
              ) : (
                "Month-to-month"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Monthly Rent
            </dt>
            <dd className="text-on-surface mt-1 font-bold">
              {formatCurrency(Number(lease.monthly_rent), lease.currency_code)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Security Deposit
            </dt>
            <dd className="text-on-surface mt-1">
              {Number(lease.security_deposit) > 0
                ? formatCurrency(
                    Number(lease.security_deposit),
                    lease.currency_code
                  )
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Signing Status
            </dt>
            <dd className="text-on-surface mt-1">
              {SIGNING_STATUS_LABELS[signingStatus] ?? signingStatus}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Your Role
            </dt>
            <dd className="text-on-surface mt-1 capitalize">
              {(primary.role ?? "tenant").replace(/-/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Property
            </dt>
            <dd className="text-on-surface mt-1">{fullAddress}</dd>
          </div>
        </dl>
      </div>

      {/* Documents in the lease */}
      {leaseDocs && leaseDocs.length > 0 && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
          <h2 className="font-headline text-lg font-bold text-primary mb-4">
            Lease Documents
          </h2>
          <div className="space-y-2">
            {leaseDocs.map((d) => {
              const label =
                DOCUMENT_TYPE_LABELS[d.document_type] ?? d.title ?? d.document_type;
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-primary">
                      description
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface truncate">
                        {d.title || label}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {SIGNING_STATUS_LABELS[d.signing_status] ??
                          d.signing_status}
                      </p>
                    </div>
                  </div>
                  {d.signed_pdf_url ? (
                    <a
                      href={d.signed_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-sm">
                        download
                      </span>
                      Signed PDF
                    </a>
                  ) : (
                    <span className="text-xs text-on-surface-variant">
                      No signed copy yet
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Signed copies in repository */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold text-primary">
            Signed Copies
          </h2>
          <Link
            href="/tenant/documents"
            className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            View all documents
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>
        {!signedDocs || signedDocs.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Once all parties sign, the executed PDF will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {signedDocs.map((d) => (
              <a
                key={d.id}
                href={d.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-outline-variant/15 bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-primary">
                    picture_as_pdf
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface truncate">
                      {d.title}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {d.category} ·{" "}
                      <DateDisplay date={d.created_at} format="medium" />
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">
                  open_in_new
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NoLeaseState() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-primary tracking-tighter leading-tight">
        Your Lease
      </h1>
      <div className="text-center py-16 bg-surface-container-low rounded-2xl">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
          description
        </span>
        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          No Active Lease
        </h2>
        <p className="text-on-surface-variant">
          You don&apos;t currently have an active or upcoming lease on file.
        </p>
      </div>
    </section>
  );
}
