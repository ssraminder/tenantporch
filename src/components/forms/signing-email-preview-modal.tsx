"use client";

export interface SigningRecipient {
  name: string;
  email: string;
  role: string;
  signingOrder: number;
}

interface SigningEmailPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sending: boolean;
  recipients: SigningRecipient[];
  propertyAddress: string;
}

export function SigningEmailPreviewModal({
  open,
  onClose,
  onConfirm,
  sending,
  recipients,
  propertyAddress,
}: SigningEmailPreviewModalProps) {
  if (!open) return null;

  const tenants = recipients.filter((r) => r.role === "tenant");
  const landlords = recipients.filter((r) => r.role === "landlord");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary text-xl">
                send
              </span>
            </div>
            <div>
              <h2 className="font-headline text-lg font-extrabold text-primary">
                Send for Signatures
              </h2>
              <p className="text-xs text-on-surface-variant">
                Review recipients and signing order before sending
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Signing Order Explanation */}
          <div className="flex items-start gap-3 p-4 bg-primary-fixed/10 rounded-xl">
            <span className="material-symbols-outlined text-on-primary-fixed-variant text-lg mt-0.5">
              info
            </span>
            <div className="text-sm text-on-primary-fixed-variant leading-relaxed">
              <p className="font-bold mb-1">Signing Order</p>
              <p>
                Tenants will receive signing emails immediately. Once all
                tenants have signed, the landlord will receive their signing
                link. No login is required &mdash; each party signs via a
                secure, personal link.
              </p>
            </div>
          </div>

          {/* Group 1: Tenants */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-on-secondary text-xs font-bold">
                1
              </span>
              <h3 className="text-sm font-bold text-on-surface">
                Tenants
              </h3>
              <span className="text-xs text-on-surface-variant">
                &mdash; receive email immediately
              </span>
            </div>
            <div className="space-y-2">
              {tenants.map((t) => (
                <div
                  key={t.email}
                  className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      person
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {t.email}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                    Tenant
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Landlord */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold">
                2
              </span>
              <h3 className="text-sm font-bold text-on-surface">
                Landlord
              </h3>
              <span className="text-xs text-on-surface-variant">
                &mdash; notified after all tenants sign
              </span>
            </div>
            <div className="space-y-2">
              {landlords.map((l) => (
                <div
                  key={l.email}
                  className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">
                      home_work
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {l.name}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {l.email}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Landlord
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Email Preview */}
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                preview
              </span>
              Email Preview
            </h3>
            <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
              <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/10">
                <p className="text-xs text-on-surface-variant">
                  <strong>Subject:</strong> Action Required: Sign Your Lease
                  for {propertyAddress}
                </p>
              </div>
              <div className="p-5 bg-white">
                <h4
                  className="text-lg font-extrabold mb-2"
                  style={{ fontFamily: "Manrope, sans-serif", color: "#273f4f" }}
                >
                  Your Lease is Ready for Signing
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Hi [Tenant Name],
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Your landlord has prepared a lease agreement for{" "}
                  <strong>{propertyAddress}</strong> that requires your
                  electronic signature.
                </p>
                <div className="text-center mb-4">
                  <span className="inline-block px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#273f4f" }}>
                    Review &amp; Sign Lease
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-gray-500 mb-1">
                    Important Details
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Property:</strong> {propertyAddress}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Signing deadline:</strong> 30 days from now
                  </p>
                </div>
                <p className="text-xs text-gray-400 italic">
                  No account or login required &mdash; the link is your
                  secure, personal signing link.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <button
            onClick={onClose}
            disabled={sending}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              {sending ? "progress_activity" : "send"}
            </span>
            {sending
              ? "Sending..."
              : `Send to ${tenants.length} Tenant${tenants.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
