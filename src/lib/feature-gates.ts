import type { FeatureGateInfo } from "@/components/shared/feature-gate-modal";

/**
 * Central feature gating configuration.
 * Maps feature keys to their gate requirements.
 */
export const FEATURE_GATES: Record<string, FeatureGateInfo> = {
  pad_payments: {
    name: "Pre-Authorized Debit (PAD)",
    description:
      "Automatically debit your tenant's bank account on the 1st of each month. Zero surcharge for tenants.",
    benefits: [
      "Automatic rent collection — no chasing payments",
      "Direct bank debit via Stripe ACSS",
      "Lower platform fee on Starter+ ($10/txn vs $15/txn)",
    ],
    minPlanSlug: "starter",
    addonSlug: "pad_auto_debit",
    addonName: "PAD auto-debit",
    addonPrice: 10,
  },
  utility_splitting: {
    name: "Utility Bill Splitting",
    description:
      "Upload utility bills and automatically calculate each tenant's share based on lease terms.",
    benefits: [
      "Auto-calculate tenant share from lease percentage",
      "Track utility payments alongside rent",
      "Generate tenant-facing utility statements",
    ],
    minPlanSlug: "starter",
    addonSlug: null,
    addonName: null,
    addonPrice: null,
  },
  financial_reports: {
    name: "Financial Reports",
    description:
      "Monthly profit & loss statements per property with automated income and expense tracking.",
    benefits: [
      "Per-property P&L statements",
      "Monthly revenue and expense summaries",
      "Exportable for tax and accounting purposes",
    ],
    minPlanSlug: "starter",
    addonSlug: null,
    addonName: null,
    addonPrice: null,
  },
  lease_builder: {
    name: "Custom Lease Builder",
    description:
      "Build custom leases from province-specific templates with clause-by-clause editing.",
    benefits: [
      "Province-compliant lease templates",
      "Editable clauses and custom terms",
      "PDF generation with professional formatting",
    ],
    minPlanSlug: "starter",
    addonSlug: null,
    addonName: null,
    addonPrice: null,
  },
  unlimited_signing: {
    name: "Unlimited E-Signatures",
    description:
      "Sign unlimited leases and addendums electronically. Free plan allows 1 signature per year.",
    benefits: [
      "Unlimited lease and addendum signing",
      "Type, draw, or upload signature methods",
      "SHA-256 tamper-proof audit trail",
    ],
    minPlanSlug: "starter",
    addonSlug: null,
    addonName: null,
    addonPrice: null,
  },
  t776_export: {
    name: "CRA T776 Export",
    description:
      "Export your rental income data in CRA T776 format for easy tax filing.",
    benefits: [
      "Auto-populate T776 rental income fields",
      "Per-property tax reporting",
      "Save hours at tax time",
    ],
    minPlanSlug: "growth",
    addonSlug: "compliance",
    addonName: "Compliance pack",
    addonPrice: 5,
  },
  lease_renewal: {
    name: "Lease Renewal Workflow",
    description:
      "Streamlined lease renewal with automated reminders, term adjustments, and re-signing.",
    benefits: [
      "Automated renewal reminders before lease end",
      "Adjust terms and rent for new period",
      "One-click re-signing workflow",
    ],
    minPlanSlug: "growth",
    addonSlug: null,
    addonName: null,
    addonPrice: null,
  },
  rent_increase_calc: {
    name: "Rent Increase Calculator",
    description:
      "Calculate allowable rent increases based on provincial guidelines and CPI data.",
    benefits: [
      "Province-specific increase limits",
      "CPI-based calculations for Alberta",
      "Generate compliant increase notices",
    ],
    minPlanSlug: "growth",
    addonSlug: "compliance",
    addonName: "Compliance pack",
    addonPrice: 5,
  },
  contractor_dispatch: {
    name: "Contractor Dispatch",
    description:
      "Dispatch maintenance contractors via email or SMS directly from maintenance requests.",
    benefits: [
      "One-click contractor notifications",
      "Email and SMS dispatch options",
      "Track contractor assignments and completion",
    ],
    minPlanSlug: "growth",
    addonSlug: null,
    addonName: null,
    addonPrice: null,
  },
  expense_tracker: {
    name: "Expense Tracker",
    description:
      "Track mortgage payments, insurance, repairs, and other property expenses for ROI analysis.",
    benefits: [
      "Categorized expense tracking",
      "Per-property expense summaries",
      "Integrate with T776 export",
    ],
    minPlanSlug: "growth",
    addonSlug: null,
    addonName: null,
    addonPrice: null,
  },
  noi_dashboard: {
    name: "NOI Dashboard",
    description:
      "Net Operating Income dashboard showing real-time profitability across your portfolio.",
    benefits: [
      "Real-time income vs expenses",
      "Cap rate and NOI calculations",
      "Portfolio-wide performance view",
    ],
    minPlanSlug: "growth",
    addonSlug: null,
    addonName: null,
    addonPrice: null,
  },
  api_access: {
    name: "API Access",
    description:
      "REST API and webhooks for integrating TenantPorch with your existing tools and systems.",
    benefits: [
      "Full REST API for all data",
      "Real-time webhooks for events",
      "Build custom integrations",
    ],
    minPlanSlug: "pro",
    addonSlug: "api_access",
    addonName: "API access",
    addonPrice: 10,
  },
  bulk_operations: {
    name: "Bulk Operations",
    description:
      "Send bulk notices, track rent for multiple tenants, and manage utilities across properties at once.",
    benefits: [
      "Multi-tenant bulk notices",
      "Bulk rent tracking and updates",
      "Batch utility billing",
    ],
    minPlanSlug: "pro",
    addonSlug: "bulk_ops",
    addonName: "Bulk operations",
    addonPrice: 8,
  },
  advanced_analytics: {
    name: "Advanced Analytics",
    description:
      "Property benchmarking, portfolio comparison, and market analysis tools.",
    benefits: [
      "Property performance benchmarking",
      "Portfolio comparison dashboards",
      "Market rent analysis",
    ],
    minPlanSlug: "pro",
    addonSlug: "advanced_analytics",
    addonName: "Advanced analytics",
    addonPrice: 8,
  },
  sms_notifications: {
    name: "SMS Notifications",
    description:
      "Send rent reminders and maintenance updates via SMS to your tenants.",
    benefits: [
      "Twilio-powered SMS delivery",
      "Rent reminder texts on the 28th",
      "Maintenance status updates",
    ],
    minPlanSlug: null,
    addonSlug: "sms",
    addonName: "SMS notifications",
    addonPrice: 3,
  },
  ai_assistant: {
    name: "AI Assistant",
    description:
      "AI-powered lease clause suggestions, communication templates, and smart draft generation.",
    benefits: [
      "Lease clause suggestions",
      "Tenant communication templates",
      "Smart draft generation",
    ],
    minPlanSlug: null,
    addonSlug: "ai_assistant",
    addonName: "AI assistant",
    addonPrice: 5,
  },
  recurring_card: {
    name: "Recurring Card Payments",
    description:
      "Automatically charge your tenant's saved card on the 1st of each month.",
    benefits: [
      "Automatic monthly card charges",
      "No manual action needed",
      "4% surcharge applies to tenant",
    ],
    minPlanSlug: null,
    addonSlug: "recurring_card",
    addonName: "Recurring card payments",
    addonPrice: 3,
  },
};

/**
 * Check if a feature is available for a given plan slug and active add-ons.
 */
const PLAN_ORDER = ["free", "starter", "growth", "pro", "enterprise"];

export function isFeatureAvailable(
  featureKey: string,
  planSlug: string,
  activeAddonSlugs: string[] = []
): boolean {
  const gate = FEATURE_GATES[featureKey];
  if (!gate) return true; // No gate = always available

  // Check plan path
  if (gate.minPlanSlug) {
    const currentIdx = PLAN_ORDER.indexOf(planSlug);
    const requiredIdx = PLAN_ORDER.indexOf(gate.minPlanSlug);
    if (currentIdx >= requiredIdx) return true;
  }

  // Check add-on path
  if (gate.addonSlug && activeAddonSlugs.includes(gate.addonSlug)) {
    return true;
  }

  // Pro includes all add-ons
  if (planSlug === "pro" || planSlug === "enterprise") return true;

  return false;
}
