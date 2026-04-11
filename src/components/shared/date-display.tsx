"use client";

export function DateDisplay({
  date,
  format = "medium",
  className,
}: {
  date: string | Date;
  format?: "short" | "medium" | "long" | "relative";
  className?: string;
}) {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    return <span className={className}>{getRelativeTime(d)}</span>;
  }

  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { month: "short", day: "numeric" }
      : format === "long"
        ? { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }
        : { year: "numeric", month: "short", day: "numeric" };

  const formatted = d.toLocaleDateString("en-CA", {
    ...options,
    timeZone: "America/Edmonton",
  });

  return <span className={className}>{formatted}</span>;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Edmonton",
  });
}
