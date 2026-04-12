"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { PlanUpgradeModal, type PlanInfo } from "./plan-upgrade-modal";
import { AddonPurchaseModal, type AddonInfo } from "./addon-purchase-modal";
import { FeatureGateModal, type FeatureGateInfo } from "./feature-gate-modal";
import { FEATURE_GATES, isFeatureAvailable } from "@/lib/feature-gates";

type PlanGateContextType = {
  planSlug: string;
  propertyCount: number;
  activeAddonSlugs: string[];
  isAvailable: (featureKey: string) => boolean;
  openUpgradeModal: () => void;
  openAddonModal: (addonSlug: string) => void;
  openFeatureGate: (featureKey: string) => void;
};

const PlanGateContext = createContext<PlanGateContextType | null>(null);

export function usePlanGate() {
  const ctx = useContext(PlanGateContext);
  if (!ctx) throw new Error("usePlanGate must be used within PlanGateProvider");
  return ctx;
}

export function PlanGateProvider({
  children,
  planSlug,
  propertyCount,
  plans,
  addons,
  activeAddonSlugs,
}: {
  children: ReactNode;
  planSlug: string;
  propertyCount: number;
  plans: PlanInfo[];
  addons: AddonInfo[];
  activeAddonSlugs: string[];
}) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);
  const [featureGateOpen, setFeatureGateOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonInfo | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureGateInfo | null>(null);

  const isAvailable = useCallback(
    (featureKey: string) => isFeatureAvailable(featureKey, planSlug, activeAddonSlugs),
    [planSlug, activeAddonSlugs]
  );

  const openUpgradeModal = useCallback(() => setUpgradeOpen(true), []);

  const openAddonModal = useCallback(
    (addonSlug: string) => {
      const addon = addons.find((a) => a.slug === addonSlug);
      if (addon) {
        setSelectedAddon(addon);
        setAddonOpen(true);
      }
    },
    [addons]
  );

  const openFeatureGate = useCallback(
    (featureKey: string) => {
      const gate = FEATURE_GATES[featureKey];
      if (gate) {
        setSelectedFeature(gate);
        setFeatureGateOpen(true);
      }
    },
    []
  );

  return (
    <PlanGateContext.Provider
      value={{
        planSlug,
        propertyCount,
        activeAddonSlugs,
        isAvailable,
        openUpgradeModal,
        openAddonModal,
        openFeatureGate,
      }}
    >
      {children}

      <PlanUpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        plans={plans}
        currentPlanSlug={planSlug}
        propertyCount={propertyCount}
      />

      <AddonPurchaseModal
        open={addonOpen}
        onClose={() => setAddonOpen(false)}
        addon={selectedAddon}
        currentPlanSlug={planSlug}
        onUpgradeClick={() => {
          setAddonOpen(false);
          setUpgradeOpen(true);
        }}
      />

      <FeatureGateModal
        open={featureGateOpen}
        onClose={() => setFeatureGateOpen(false)}
        feature={selectedFeature}
        currentPlanSlug={planSlug}
        onUpgradeClick={() => {
          setFeatureGateOpen(false);
          setUpgradeOpen(true);
        }}
        onAddonClick={(slug) => {
          setFeatureGateOpen(false);
          openAddonModal(slug);
        }}
      />
    </PlanGateContext.Provider>
  );
}
