"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { formatCurrency } from "@/lib/currency";
import { downloadCSV } from "@/lib/csv-export";

type Tenant = {
  leaseTenantId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isPrimaryContact: boolean;
  leaseId: string;
  leaseStatus: { label: string; key: string };
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  monthlyRent: number;
  currencyCode: string;
  propertyAddress: string;
};

export function TenantsList({ tenants }: { tenants: Tenant[] }) {
  const [search, setSearch] = useState("");

  const query = search.toLowerCase().trim();

  const filtered = query
    ? tenants.filter((t) => {
        const fields = [
          t.firstName,
          t.lastName,
          `${t.firstName} ${t.lastName}`,
          t.email,
          t.propertyAddress,
        ];
        return fields.some((f) => f && f.toLowerCase().includes(query));
      })
    : tenants;

  return (
    <>
      {/* Search + Export */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or property..."
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <button
          onClick={() => {
            const rows = filtered.map((t) => ({
              Name: `${t.firstName} ${t.lastName}`,
              Email: t.email,
              Property: t.propertyAddress,
              "Lease Status": t.leaseStatus.label,
              "Rent Amount": formatCurrency(t.monthlyRent, t.currencyCode),
            }));
            const today = new Date().toISOString().slice(0, 10);
            downloadCSV(rows, `tenants_export_${today}.csv`);
          }}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-surface-container-low text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          title="Export filtered tenants as CSV"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Tenant List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((tenant) => (
            <Link
              key={tenant.leaseTenantId}
              href={`/admin/tenants/${tenant.userId}`}
              className="block bg-surface-container-lowest p-5 md:p-6 rounded-xl shadow-ambient-sm hover:bg-surface-bright transition-colors group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-primary-fixed/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-on-primary-fixed-variant">
                    {tenant.firstName?.[0]?.toUpperCase() ?? ""}
                    {tenant.lastName?.[0]?.toUpperCase() ?? ""}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row: name + badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-headline font-bold text-primary truncate">
                      {tenant.firstName} {tenant.lastName}
                    </h3>
                    <StatusBadge status={tenant.leaseStatus.key} />
                    {tenant.role === "permitted_occupant" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant">
                        Occupant
                      </span>
                    )}
                    {tenant.isPrimaryContact && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed/30 text-on-tertiary-fixed-variant">
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant mb-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">mail</span>
                      {tenant.email}
                    </span>
                    {tenant.phone && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">phone</span>
                        {tenant.phone}
                      </span>
                    )}
                  </div>

                  {/* Property + Lease info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-xs">apartment</span>
                      {tenant.propertyAddress}
                    </span>
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-xs">payments</span>
                      {formatCurrency(tenant.monthlyRent, tenant.currencyCode)}/mo
                    </span>
                    {tenant.leaseStartDate && (
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-xs">event</span>
                        <DateDisplay date={tenant.leaseStartDate} format="short" />
                        {tenant.leaseEndDate && (
                          <>
                            <span className="mx-0.5">&ndash;</span>
                            <DateDisplay date={tenant.leaseEndDate} format="short" />
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors self-center">
                  chevron_right
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : query ? (
        /* No search results */
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
              search_off
            </span>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            No tenants match your search
          </h2>
          <p className="text-sm text-on-surface-variant max-w-sm">
            Try adjusting your search terms or clear the search to see all tenants.
          </p>
        </div>
      ) : (
        /* Empty State (no tenants at all) */
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
            group
          </span>
          <h2 className="font-headline text-xl font-bold text-primary mb-2">
            No Tenants Yet
          </h2>
          <p className="text-on-surface-variant mb-6">
            Once you add properties and leases, your tenants will appear here.
          </p>
          <Link
            href="/admin/tenants/invite"
            className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Invite Your First Tenant
          </Link>
        </div>
      )}
    </>
  );
}
