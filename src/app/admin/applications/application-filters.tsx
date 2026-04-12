"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";

type AppItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
  propertyCity: string;
  monthlyIncome: number | null;
  occupants: number;
  moveInDate: string | null;
  status: string;
  createdAt: string;
};

const TABS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "reviewing", label: "Reviewing" },
  { key: "approved", label: "Approved" },
  { key: "declined", label: "Declined" },
];

export function ApplicationFilters({
  applications,
  statusCounts,
}: {
  applications: AppItem[];
  statusCounts: Record<string, number>;
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = applications.filter((app) => {
    if (activeTab !== "all" && app.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.propertyAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-on-primary shadow-ambient-sm"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs ${
                activeTab === tab.key
                  ? "text-on-primary/70"
                  : "text-on-surface-variant/60"
              }`}
            >
              {statusCounts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or property..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-ambient-sm"
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-12 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-outline-variant text-4xl mb-3">
            person_search
          </span>
          <h2 className="font-headline text-lg font-bold text-on-surface mb-1">
            No applications
          </h2>
          <p className="text-sm text-on-surface-variant">
            {search
              ? "No applications match your search."
              : "No applications in this category yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => (
            <Link
              key={app.id}
              href={`/admin/applications/${app.id}`}
              className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm hover:shadow-ambient transition-shadow overflow-hidden"
            >
              <div className="p-5 space-y-3">
                {/* Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-primary truncate">
                      {app.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {app.email}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                {/* Property */}
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs">
                    apartment
                  </span>
                  <span className="truncate">
                    {app.propertyAddress}
                    {app.propertyCity ? `, ${app.propertyCity}` : ""}
                  </span>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                  {app.monthlyIncome && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        payments
                      </span>
                      ${app.monthlyIncome.toLocaleString()}/mo
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      group
                    </span>
                    {app.occupants}{" "}
                    {app.occupants === 1 ? "occupant" : "occupants"}
                  </span>
                  {app.moveInDate && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        event
                      </span>
                      <DateDisplay date={app.moveInDate} format="short" />
                    </span>
                  )}
                </div>

                {/* Submitted date */}
                <div className="pt-2 border-t border-outline-variant/10">
                  <span className="text-[11px] text-on-surface-variant">
                    Applied{" "}
                    <DateDisplay date={app.createdAt} format="relative" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
