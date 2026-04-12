"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { formatCurrency } from "@/lib/currency";
import { downloadCSV } from "@/lib/csv-export";

type Payment = {
  id: string;
  lease_id: string;
  tenant_id: string;
  amount: number;
  surcharge_percent: number | null;
  surcharge_amount: number | null;
  total_charged: number | null;
  currency_code: string;
  payment_method: string;
  payment_for_month: string | null;
  status: string;
  created_at: string;
  tenantName: string;
  propertyAddress: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const METHOD_OPTIONS = [
  { value: "all", label: "All Methods" },
  { value: "etransfer", label: "E-Transfer" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "pad", label: "PAD" },
];

const PER_PAGE = 15;

const selectCls =
  "w-full pl-10 pr-10 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer";

export function PaymentList({ payments }: { payments: Payment[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);

  const query = search.toLowerCase().trim();

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      // Status filter
      if (statusFilter !== "all" && p.status !== statusFilter) return false;

      // Method filter
      if (
        methodFilter !== "all" &&
        (p.payment_method ?? "").toLowerCase() !== methodFilter
      )
        return false;

      // Search filter
      if (query) {
        const fields = [p.tenantName, p.propertyAddress];
        if (!fields.some((f) => f && f.toLowerCase().includes(query)))
          return false;
      }

      return true;
    });
  }, [payments, statusFilter, methodFilter, query]);

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const clampedPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (clampedPage - 1) * PER_PAGE,
    clampedPage * PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };
  const handleMethodChange = (v: string) => {
    setMethodFilter(v);
    setPage(1);
  };
  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
      <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            receipt_long
          </span>
          <h3 className="font-headline font-bold text-lg">Payment History</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const rows = filtered.map((p) => ({
                Date: p.created_at,
                Tenant: p.tenantName,
                Property: p.propertyAddress,
                Amount: formatCurrency(
                  Number(p.total_charged ?? p.amount ?? 0),
                  p.currency_code ?? "CAD"
                ),
                Method: (p.payment_method ?? "").toUpperCase(),
                Status:
                  p.status.charAt(0).toUpperCase() + p.status.slice(1),
              }));
              const today = new Date().toISOString().slice(0, 10);
              downloadCSV(rows, `payments_export_${today}.csv`);
            }}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold hover:bg-surface-container-highest hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export filtered payments as CSV"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
          <span className="text-xs text-on-surface-variant font-medium">
            {filtered.length} of {payments.length}{" "}
            {payments.length === 1 ? "payment" : "payments"}
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="px-6 md:px-8 py-4 bg-surface-container-low/50 border-b border-outline-variant/10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search tenant or property..."
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              filter_list
            </span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={selectCls}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Method dropdown */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              credit_card
            </span>
            <select
              value={methodFilter}
              onChange={(e) => handleMethodChange(e.target.value)}
              className={selectCls}
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
            {payments.length === 0 ? "payments" : "search_off"}
          </span>
          <p className="text-sm text-on-surface-variant">
            {payments.length === 0
              ? "No payments recorded yet"
              : "No payments match your filters"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="block md:hidden divide-y divide-outline-variant/10">
            {paginated.map((payment) => (
              <div key={payment.id} className="px-6 py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {payment.propertyAddress}
                    </p>
                    {payment.tenantName !== "—" && (
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-xs">
                          person
                        </span>
                        {payment.tenantName}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={payment.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(
                        Number(payment.total_charged ?? payment.amount ?? 0),
                        payment.currency_code ?? "CAD"
                      )}
                    </span>
                    <PaymentMethodBadge
                      method={payment.payment_method ?? "etransfer"}
                    />
                  </div>
                  <DateDisplay
                    date={payment.created_at}
                    format="short"
                    className="text-xs text-on-surface-variant"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant font-black">
                  <th className="px-6 md:px-8 py-3">Date</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Surcharge</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 pr-6 md:pr-8">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {paginated.map((payment) => {
                  const currency = payment.currency_code ?? "CAD";

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-6 md:px-8 py-4 text-sm text-on-surface whitespace-nowrap">
                        <DateDisplay date={payment.created_at} format="short" />
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-primary">
                        {payment.tenantName}
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant truncate max-w-[200px]">
                        {payment.propertyAddress}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-on-surface text-right">
                        {formatCurrency(Number(payment.amount ?? 0), currency)}
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant text-right">
                        {Number(payment.surcharge_amount ?? 0) > 0
                          ? formatCurrency(
                              Number(payment.surcharge_amount),
                              currency
                            )
                          : "--"}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-primary text-right">
                        {formatCurrency(
                          Number(
                            payment.total_charged ?? payment.amount ?? 0
                          ),
                          currency
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <PaymentMethodBadge
                          method={payment.payment_method ?? "etransfer"}
                        />
                      </td>
                      <td className="px-4 py-4 pr-6 md:pr-8">
                        <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 md:px-8 py-4 bg-surface-container-low flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                Page {clampedPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                {clampedPage > 1 && (
                  <button
                    onClick={() => setPage(clampedPage - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                    Previous
                  </button>
                )}
                {clampedPage < totalPages && (
                  <button
                    onClick={() => setPage(clampedPage + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors"
                  >
                    Next
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
