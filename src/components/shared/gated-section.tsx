"use client";

import { usePlanGate } from "./plan-gate-provider";
import type { ReactNode } from "react";

/**
 * Wraps a section of UI and shows a locked overlay when the feature
 * is not available on the current plan/add-ons.
 *
 * Use inside any client component or as a direct child in a server component
 * (works because admin layout wraps everything in PlanGateProvider).
 */
export function GatedSection({
  featureKey,
  children,
  label,
}: {
  featureKey: string;
  children: ReactNode;
  label?: string;
}) {
  const { isAvailable, openFeatureGate } = usePlanGate();

  if (isAvailable(featureKey)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content underneath */}
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-surface/60 rounded-2xl">
        <button
          onClick={() => openFeatureGate(featureKey)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-surface-container-lowest shadow-ambient-md hover:shadow-ambient-lg transition-shadow"
        >
          <span className="material-symbols-outlined text-primary text-xl">lock</span>
          <span className="text-sm font-bold text-primary">
            {label ?? "Unlock Feature"} — View Details
          </span>
        </button>
      </div>
    </div>
  );
}
