"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { PayNowModal } from "./pay-now-modal";

interface PayRentSectionProps {
  displayAmount: number;
  currency: string;
  surcharge: number;
  leaseId: string;
  landlordEmail: string;
  propertyAddress: string;
  dueDateLabel: string;
  isLeaseEnded: boolean;
}

export function PayRentSection({
  displayAmount,
  currency,
  surcharge,
  leaseId,
  landlordEmail,
  propertyAddress,
  dueDateLabel,
  isLeaseEnded,
}: PayRentSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isLeaseEnded) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-4xl text-outline-variant mb-3 block">
          check_circle
        </span>
        <p className="text-on-surface-variant font-medium">
          Your lease has ended. No payments are due.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
              Payment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-on-surface-variant font-bold">{currency} $</span>
              </div>
              <div className="w-full pl-16 pr-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-lg font-headline font-bold text-primary">
                {formatCurrency(displayAmount, currency)
                  .replace(/^\$/, "")
                  .replace(/^CA\$/, "")}
              </div>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <p className="text-xs font-bold text-on-surface-variant uppercase">
              Available Methods
            </p>
            {/* E-Transfer */}
            <button
              onClick={() => setModalOpen(true)}
              className="w-full text-left p-4 bg-surface-bright border-2 border-secondary rounded-xl hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-secondary">swap_horiz</span>
                <div className="flex-1">
                  <span className="text-sm font-bold text-primary">Interac E-Transfer</span>
                  <span className="block text-[10px] text-tertiary-fixed-dim uppercase font-bold">
                    No Surcharge
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-secondary transition-colors text-sm">
                  arrow_forward
                </span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg text-xs text-on-surface-variant">
                <p>
                  Send to: <span className="font-bold text-primary">{landlordEmail}</span>
                </p>
              </div>
            </button>
            {/* Card */}
            <div className="p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl opacity-60">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline-variant">credit_card</span>
                <div className="flex-1">
                  <span className="text-sm font-bold text-primary">Credit / Debit Card</span>
                  <span className="block text-[10px] text-on-surface-variant font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Order Summary */}
        <div className="bg-primary text-white rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-ambient-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="space-y-4 relative z-10">
            <h5 className="text-sm font-bold text-blue-200/50 uppercase tracking-widest">
              Order Summary
            </h5>
            <div className="flex justify-between items-center py-2">
              <span className="text-blue-100/70 text-sm">Rent Amount</span>
              <span className="font-bold">{formatCurrency(displayAmount, currency)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-white/10">
              <span className="text-blue-100/70 text-sm">Surcharge ({surcharge}%)</span>
              <span className="font-bold">{formatCurrency(0, currency)}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-t border-white/20 mt-4">
              <span className="text-white font-black text-lg">Total</span>
              <span className="text-2xl font-black text-secondary-fixed-dim">
                {formatCurrency(displayAmount, currency)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="w-full bg-secondary-fixed text-on-secondary-fixed py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all mt-6 relative z-10 shadow-lg shadow-black/40"
          >
            Process Payment
          </button>
          <p className="text-[10px] text-center text-blue-200/40 mt-4 font-medium italic">
            Payments are protected by 256-bit SSL encryption
          </p>
        </div>
      </div>

      <PayNowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        amountDue={displayAmount}
        leaseId={leaseId}
        currency={currency}
        landlordEmail={landlordEmail}
        propertyAddress={propertyAddress}
        dueDateLabel={dueDateLabel}
      />
    </>
  );
}
