"use client";

import { useState } from "react";

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
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  if (!open) return null;

  const tenants = recipients.filter((r) => r.role === "tenant");
  const landlords = recipients.filter((r) => r.role === "landlord");

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop — hidden on mobile since modal is full-screen */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm hidden sm:block"
        onClick={onClose}
      />

      {/* Modal — full-screen on mobile, centered on desktop */}
      <div className="relative bg-surface-container-lowest sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-outline-variant/10 flex items-center gap-3">
          <button
            onClick={onClose}
            className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">
              close
            </span>
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-tertiary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-tertiary text-lg sm:text-xl">
              send
            </span>
          </div>
          <div>
            <h2 className="font-headline text-base sm:text-lg font-extrabold text-primary">
              Send for Signatures
            </h2>
            <p className="text-[11px] sm:text-xs text-on-surface-variant">
              Review recipients and signing order before sending
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {/* Signing Order Explanation */}
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-primary-fixed/10 rounded-xl">
            <span className="material-symbols-outlined text-on-primary-fixed-variant text-base sm:text-lg mt-0.5">
              info
            </span>
            <div className="text-xs sm:text-sm text-on-primary-fixed-variant leading-relaxed">
              <p className="font-bold mb-1">Signing Order</p>
              <p>
                Tenants receive signing emails immediately. Once all
                tenants sign, the landlord gets their link. No login
                required.
              </p>
            </div>
          </div>

          {/* Group 1: Tenants */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-secondary text-on-secondary text-[10px] sm:text-xs font-bold">
                1
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                Tenants
              </h3>
              <span className="text-[10px] sm:text-xs text-on-surface-variant">
                &mdash; receive email immediately
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {tenants.map((t) => (
                <div
                  key={t.email}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-surface-container-low rounded-xl"
                >
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-xs sm:text-sm">
                      person
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-on-surface truncate">
                      {t.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-on-surface-variant truncate">
                      {t.email}
                    </p>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    Tenant
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Landlord */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-on-primary text-[10px] sm:text-xs font-bold">
                2
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                Landlord
              </h3>
              <span className="text-[10px] sm:text-xs text-on-surface-variant">
                &mdash; notified after all tenants sign
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {landlords.map((l) => (
                <div
                  key={l.email}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-surface-container-low rounded-xl"
                >
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xs sm:text-sm">
                      home_work
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-on-surface truncate">
                      {l.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-on-surface-variant truncate">
                      {l.email}
                    </p>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    Landlord
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Email Preview — collapsible on mobile */}
          <div>
            <button
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              className="sm:hidden w-full flex items-center justify-between text-xs font-bold text-on-surface mb-2"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">preview</span>
                Email Preview
              </span>
              <span className="material-symbols-outlined text-xs text-on-surface-variant">
                {showEmailPreview ? "expand_less" : "expand_more"}
              </span>
            </button>
            <h3 className="hidden sm:flex text-sm font-bold text-on-surface mb-3 items-center gap-2">
              <span className="material-symbols-outlined text-sm">preview</span>
              Email Preview
            </h3>
            <div className={`${showEmailPreview ? "block" : "hidden"} sm:block`}>
              <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                <div className="bg-surface-container-low px-3 sm:px-4 py-2 border-b border-outline-variant/10">
                  <p className="text-[10px] sm:text-xs text-on-surface-variant">
                    <strong>Subject:</strong> Action Required: Sign Your Lease
                    for {propertyAddress}
                  </p>
                </div>
                <div className="p-4 sm:p-5 bg-white">
                  <h4
                    className="text-base sm:text-lg font-extrabold mb-2"
                    style={{ fontFamily: "Manrope, sans-serif", color: "#273f4f" }}
                  >
                    Your Lease is Ready for Signing
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    Hi [Tenant Name],
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Your landlord has prepared a lease agreement for{" "}
                    <strong>{propertyAddress}</strong> that requires your
                    electronic signature.
                  </p>
                  <div className="text-center mb-3 sm:mb-4">
                    <span className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-white" style={{ backgroundColor: "#273f4f" }}>
                      Review &amp; Sign Lease
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-500 mb-1">
                      Important Details
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700">
                      <strong>Property:</strong> {propertyAddress}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700">
                      <strong>Signing deadline:</strong> 30 days from now
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400 italic">
                    No account or login required &mdash; the link is your
                    secure, personal signing link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — always visible */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-tertiary text-on-tertiary text-xs sm:text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xs sm:text-sm">
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
