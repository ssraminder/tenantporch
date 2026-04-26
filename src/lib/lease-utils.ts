/**
 * Shared lease status utilities.
 * Handles timezone-safe date comparisons and contextual status badges.
 */

/**
 * Format a day-of-month number as a recurring rent-due-day string.
 * 1  -> "1st of every month"
 * 2  -> "2nd of every month"
 * 23 -> "23rd of every month"
 * 31 -> "last day of every month" (so the lease still makes sense in February)
 */
export function formatRentDueDay(day: number | null | undefined): string {
  if (day == null || day < 1 || day > 31) return "";
  if (day === 31) return "last day of every month";
  const j = day % 10;
  const k = day % 100;
  let suffix = "th";
  if (k < 11 || k > 13) {
    if (j === 1) suffix = "st";
    else if (j === 2) suffix = "nd";
    else if (j === 3) suffix = "rd";
  }
  return `${day}${suffix} of every month`;
}

/**
 * Get today's date as YYYY-MM-DD string in America/Edmonton timezone.
 * Avoids timezone bugs when comparing with date-only strings from the database.
 */
export function getTodayDateString(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Count calendar days between two YYYY-MM-DD strings.
 * Positive if target is in the future, negative if in the past.
 */
export function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export type LeaseDisplayStatus = {
  /** Human-readable label */
  label: string;
  /** Machine-readable key for StatusBadge */
  key: string;
};

/**
 * Determine the contextual display status for a lease.
 *
 * Priority:
 *   1. status='draft'                                  → Draft (gray)
 *   2. status='terminated'                             → Terminated (red)
 *   3. status='expired' OR end_date < today            → Expired (red)
 *   4. status='active' AND start_date > today          → Upcoming (blue)
 *   5. status='active' AND end_date within 30 days     → Expiring Soon (amber)
 *   6. status='active' AND within date range           → Active (green)
 */
export function getLeaseDisplayStatus(lease: {
  status: string;
  start_date: string;
  end_date: string | null;
}): LeaseDisplayStatus {
  const today = getTodayDateString();

  // 1. Draft
  if (lease.status === "draft") {
    return { label: "Draft", key: "draft" };
  }

  // 2. Terminated
  if (lease.status === "terminated") {
    return { label: "Terminated", key: "terminated" };
  }

  // 3. Expired: db status is expired OR end_date has passed
  if (
    lease.status === "expired" ||
    (lease.end_date && lease.end_date < today)
  ) {
    return { label: "Expired", key: "expired" };
  }

  // 4. Upcoming: active lease whose start_date hasn't arrived yet
  if (lease.start_date > today) {
    return { label: "Upcoming", key: "upcoming_lease" };
  }

  // 5. Expiring Soon: end_date is within 30 days
  if (lease.end_date) {
    const daysLeft = daysBetween(today, lease.end_date);
    if (daysLeft >= 0 && daysLeft <= 30) {
      return { label: "Expiring Soon", key: "expiring_soon" };
    }
  }

  // 6. Active
  return { label: "Active", key: "active" };
}

/**
 * Contextual label for the dashboard hero card.
 * Returns a short descriptor and optional detail text.
 */
export function getLeaseHeroLabel(lease: {
  status: string;
  start_date: string;
  end_date: string | null;
}): { heading: string; sublabel: string | null; showWelcomeHome: boolean } {
  const displayStatus = getLeaseDisplayStatus(lease);
  const today = getTodayDateString();

  switch (displayStatus.key) {
    case "draft":
      return {
        heading: "Lease Pending",
        sublabel: "Your lease is being prepared",
        showWelcomeHome: false,
      };
    case "upcoming_lease": {
      const daysUntil = daysBetween(today, lease.start_date);
      return {
        heading: "Upcoming Lease",
        sublabel: `Lease starts in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
        showWelcomeHome: false,
      };
    }
    case "expiring_soon": {
      const daysLeft = lease.end_date
        ? daysBetween(today, lease.end_date)
        : 0;
      return {
        heading: "Lease Expiring Soon",
        sublabel: `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`,
        showWelcomeHome: true,
      };
    }
    case "expired":
      return {
        heading: "Lease Ended",
        sublabel: null,
        showWelcomeHome: false,
      };
    case "terminated":
      return {
        heading: "Lease Terminated",
        sublabel: null,
        showWelcomeHome: false,
      };
    default:
      return {
        heading: "Current Residence",
        sublabel: null,
        showWelcomeHome: true,
      };
  }
}
