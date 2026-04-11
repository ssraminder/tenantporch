import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // Payment / rent schedule statuses
  paid: "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant",
  completed: "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant",
  confirmed: "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant",
  settled: "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant",
  due: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  upcoming: "bg-primary-fixed/30 text-on-primary-fixed-variant",
  pending: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  overdue: "bg-error-container text-on-error-container",
  partial: "bg-primary-fixed/30 text-on-primary-fixed-variant",
  cancelled: "bg-surface-variant text-on-surface-variant",
  failed: "bg-error-container text-on-error-container",

  // Lease display statuses (from getLeaseDisplayStatus)
  draft: "bg-surface-variant text-on-surface-variant",
  active: "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant",
  upcoming_lease: "bg-primary-fixed/30 text-on-primary-fixed-variant",
  expiring_soon: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  expired: "bg-error-container text-on-error-container",
  terminated: "bg-error-container text-on-error-container",

  // Property statuses
  vacant: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  occupied: "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant",
  maintenance: "bg-error-container text-on-error-container",

  // Maintenance statuses
  submitted: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  acknowledged: "bg-primary-fixed/30 text-on-primary-fixed-variant",
  in_progress: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
  scheduled: "bg-primary-fixed/30 text-on-primary-fixed-variant",
  open: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",

  // Message / notification statuses
  read: "bg-surface-variant text-on-surface-variant",
  unread: "bg-secondary-fixed/30 text-on-secondary-fixed-variant",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toLowerCase().replace(/[\s-]/g, "_");
  const style = STATUS_STYLES[key] ?? "bg-surface-variant text-on-surface-variant";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
