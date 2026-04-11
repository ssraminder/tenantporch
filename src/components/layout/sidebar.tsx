"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  role: "tenant" | "landlord";
}

export function Sidebar({ items, role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed h-screen flex flex-col gap-2 py-6 bg-primary w-64 hidden lg:flex left-0 top-0 z-40 shadow-ambient-lg">
      {/* Logo */}
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-black text-white italic font-headline">
          TenantPorch
        </h1>
        <p className="font-headline font-medium text-sm text-inverse-primary/70">
          {role === "landlord" ? "Property Management" : "Tenant Portal"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-3 mx-4 flex items-center gap-3 transition-all font-headline font-medium text-sm rounded-lg",
                isActive
                  ? "bg-primary-container text-white translate-x-1"
                  : "text-inverse-primary/70 hover:text-white hover:bg-primary-container/50"
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom action */}
      {role === "landlord" && (
        <div className="px-6 mt-auto">
          <Link
            href="/admin/properties/new"
            className="w-full py-3 px-4 bg-secondary-fixed-dim text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-secondary-fixed transition-colors"
          >
            <span className="material-symbols-outlined">add_home</span>
            <span>Add Property</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
