import { getSigningData } from "@/app/admin/actions/signing-actions";
import { LeaseSigningClient } from "@/components/forms/lease-signing-client";
import { Logo } from "@/components/shared/logo";
import type { LeaseDocumentContent } from "@/lib/lease-templates/alberta";

export const metadata = {
  title: "Sign Lease — TenantPorch",
  description: "Review and sign your lease agreement electronically.",
};

export default async function LeaseSigningPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getSigningData(token);

  // Invalid or expired link
  if (!result.success && result.error !== "already_signed") {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-on-error-container">
                link_off
              </span>
            </div>
            <h1 className="font-headline text-xl font-bold text-on-surface mb-2">
              Invalid Signing Link
            </h1>
            <p className="text-sm text-on-surface-variant">
              {result.error ??
                "This signing link is invalid or has expired. Please contact your landlord for a new link."}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Already signed
  if (result.error === "already_signed") {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-on-tertiary-fixed-variant">
                task_alt
              </span>
            </div>
            <h1 className="font-headline text-xl font-bold text-on-surface mb-2">
              Thank You for Signing
            </h1>
            <p className="text-sm text-on-surface-variant">
              Your signature has been recorded. A fully signed copy will be
              emailed to all parties once everyone has signed.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const {
    participant,
    lease,
    property,
    signingRequest,
    participants,
    documentTitle,
  } = result as any;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page Title */}
        <div className="text-center space-y-2">
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            {documentTitle ?? "Residential Lease Agreement"}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {property?.address ?? "Property"}
          </p>
          <p className="text-sm text-on-surface-variant">
            Please review all terms and sign below
          </p>
        </div>

        <LeaseSigningClient
          token={token}
          participantName={participant.signerName}
          participantRole={participant.signerRole}
          documentContent={lease.documentContent as LeaseDocumentContent}
          propertyAddress={property?.address ?? ""}
          participants={participants}
          expiresAt={signingRequest.expiresAt}
        />
      </main>

      <Footer />
    </div>
  );
}

/* ─── Reusable sub-components ────────────────────────────────────────────── */

function Header() {
  return (
    <header className="w-full bg-surface-container-lowest shadow-ambient-sm">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Logo height={28} />
        <span className="text-sm font-semibold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
          Lease Signing
        </span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-surface-container-low">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center space-y-2">
        <p className="text-xs text-on-surface-variant font-semibold">
          Powered by TenantPorch
        </p>
        <p className="text-xs text-on-surface-variant leading-relaxed max-w-lg mx-auto">
          This lease is prepared in accordance with the Alberta Residential
          Tenancies Act (RTA) and the Electronic Transactions Act (SA 2001, c.
          E-5.5). Both landlord and tenant rights and obligations are governed by
          provincial legislation.
        </p>
      </div>
    </footer>
  );
}
