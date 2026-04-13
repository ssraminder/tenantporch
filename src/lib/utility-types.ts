/** Shared utility type config used across utility billing pages and actions */

export const UTILITY_ICONS: Record<string, string> = {
  electricity: "bolt",
  gas: "local_fire_department",
  water: "water_drop",
  internet: "wifi",
  sewer: "plumbing",
  trash: "delete_sweep",
  other: "category",
};

export const UTILITY_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas: "Gas",
  water: "Water",
  internet: "Internet",
  sewer: "Sewer",
  trash: "Garbage",
  other: "Other",
};

/**
 * Parse a comma-separated utility_type string and return a display label.
 * e.g. "water,trash" → "Water + Garbage"
 */
export function getUtilityLabel(utilityType: string): string {
  const types = utilityType.split(",").map((t) => t.trim()).filter(Boolean);
  return types.map((t) => UTILITY_LABELS[t] ?? t).join(" + ");
}

/**
 * Get the primary icon for a utility_type string.
 * If multiple types, returns the first one's icon.
 */
export function getUtilityIcon(utilityType: string): string {
  const first = utilityType.split(",")[0]?.trim();
  return UTILITY_ICONS[first] ?? "category";
}
