"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/currency";
import { getLeaseDisplayStatus } from "@/lib/lease-utils";

type Property = {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province_state: string;
  postal_code: string;
  unit_description: string | null;
  status: string;
  monthly_rent: number;
  created_at: string;
};

type LeaseInfo = {
  status: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  currency_code: string;
  tenant_count: number;
};

export function PropertiesList({
  properties,
  leasesByProperty,
}: {
  properties: Property[];
  leasesByProperty: Record<string, LeaseInfo>;
}) {
  const [search, setSearch] = useState("");

  const query = search.toLowerCase().trim();

  const filtered = query
    ? properties.filter((p) => {
        const fields = [
          p.address_line1,
          p.address_line2,
          p.city,
          p.province_state,
          p.postal_code,
        ];
        return fields.some((f) => f && f.toLowerCase().includes(query));
      })
    : properties;

  return (
    <>
      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by address, city, or postal code..."
          className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Property Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((property) => {
            const lease = leasesByProperty[property.id];
            const leaseDisplay = lease
              ? getLeaseDisplayStatus({
                  status: lease.status,
                  start_date: lease.start_date,
                  end_date: lease.end_date,
                })
              : null;

            return (
              <Link
                key={property.id}
                href={`/admin/properties/${property.id}`}
                className="group bg-surface-container-lowest rounded-2xl shadow-ambient-sm hover:shadow-ambient transition-shadow overflow-hidden"
              >
                {/* Status accent bar */}
                <div
                  className={`h-1 ${
                    property.status === "occupied"
                      ? "bg-tertiary-fixed-dim"
                      : property.status === "maintenance"
                        ? "bg-error"
                        : "bg-secondary-fixed-dim"
                  }`}
                />

                <div className="p-5 space-y-4">
                  {/* Address and status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-headline font-bold text-on-surface truncate">
                        {property.address_line1}
                      </h3>
                      {property.unit_description && (
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {property.unit_description}
                        </p>
                      )}
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        {property.city}, {property.province_state}
                      </p>
                    </div>
                    <StatusBadge status={property.status} />
                  </div>

                  {/* Rent */}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">
                      payments
                    </span>
                    <span className="text-sm font-semibold text-on-surface">
                      {formatCurrency(property.monthly_rent)} / mo
                    </span>
                  </div>

                  {/* Lease info */}
                  <div className="bg-surface-container-low rounded-xl px-4 py-3 space-y-2">
                    {lease && leaseDisplay ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-on-surface-variant">
                            Lease
                          </span>
                          <StatusBadge status={leaseDisplay.key} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">
                            group
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {lease.tenant_count}{" "}
                            {lease.tenant_count === 1 ? "tenant" : "tenants"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant/60 text-sm">
                          gavel
                        </span>
                        <span className="text-xs text-on-surface-variant/60">
                          No active lease
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View detail arrow */}
                  <div className="flex items-center justify-end text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
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
            No properties match your search
          </h2>
          <p className="text-sm text-on-surface-variant max-w-sm">
            Try adjusting your search terms or clear the search to see all properties.
          </p>
        </div>
      ) : (
        /* Empty State (no properties at all) */
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary-fixed/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-on-primary-fixed-variant">
              home_work
            </span>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            Add your first property
          </h2>
          <p className="text-sm text-on-surface-variant max-w-sm mb-8">
            Start managing your rental properties by adding your first listing.
            You can track leases, tenants, and maintenance all in one place.
          </p>
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Property
          </Link>
        </div>
      )}
    </>
  );
}
