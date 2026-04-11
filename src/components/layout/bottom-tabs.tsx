"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  href: string;
  icon: string;
}

interface BottomTabsProps {
  items: TabItem[];
}

export function BottomTabs({ items }: BottomTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full rounded-t-2xl z-50 bg-surface-container-lowest/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 lg:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-2 py-1 transition-colors duration-200",
              isActive
                ? "text-secondary bg-secondary-fixed/20 rounded-xl scale-90"
                : "text-on-surface-variant active:bg-surface-container-low"
            )}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label text-[10px] font-medium tracking-wide uppercase mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
