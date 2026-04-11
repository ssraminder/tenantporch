"use client";

import { cn } from "@/lib/utils";

export function RentCountdown({
  dueDate,
  className,
}: {
  dueDate: string | Date;
  className?: string;
}) {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let text: string;
  let colorClass: string;

  if (diffDays > 7) {
    text = `Due in ${diffDays} days`;
    colorClass = "text-on-surface-variant";
  } else if (diffDays > 0) {
    text = `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    colorClass = "text-secondary";
  } else if (diffDays === 0) {
    text = "Due today";
    colorClass = "text-secondary font-bold";
  } else {
    text = `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} overdue`;
    colorClass = "text-error font-bold";
  }

  return (
    <span className={cn("text-sm", colorClass, className)}>
      {text}
    </span>
  );
}
