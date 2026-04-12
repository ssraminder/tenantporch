"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  role: "tenant" | "landlord";
  planName?: string | null;
  planSlug?: string | null;
  propertyAddress?: string | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

export function Sidebar({ items, role, planName, planSlug, propertyAddress, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <aside className="fixed h-screen flex flex-col gap-2 py-6 bg-primary w-64 hidden lg:flex left-0 top-0 z-40 shadow-ambient-lg">
      {/* Logo */}
      <div className="px-6 mb-8">
        <Logo height={28} type={role === "landlord" ? "landlord" : "tenant"} background="dark" />
        {role === "tenant" && propertyAddress && (
          <p className="font-headline font-medium text-xs text-inverse-primary/50 mt-1.5 truncate">
            {propertyAddress}
          </p>
        )}
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

      {/* Bottom section */}
      <div className="mt-auto space-y-3 px-6">
        {/* Add Property CTA */}
        {role === "landlord" && (
          <Link
            href="/admin/properties/new"
            className="w-full py-3 px-4 bg-secondary-fixed-dim text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-secondary-fixed transition-colors"
          >
            <span className="material-symbols-outlined">add_home</span>
            <span>Add Property</span>
          </Link>
        )}

        {/* Plan badge */}
        {role === "landlord" && planName && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-container/50">
            <span className="material-symbols-outlined text-inverse-primary/70 text-sm">workspace_premium</span>
            <span className="text-xs font-bold text-inverse-primary/70 uppercase tracking-wider">{planName} Plan</span>
          </div>
        )}

        {/* User controls */}
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none cursor-pointer flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8 shrink-0 border-2 border-inverse-primary/30">
                <AvatarFallback className="bg-primary-container text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-inverse-primary/50 truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-48 bg-surface-container-lowest/80 backdrop-blur-xl border-outline-variant/15 rounded-xl"
            >
              <DropdownMenuItem
                onClick={() => router.push(role === "landlord" ? "/admin/settings" : "/tenant/profile")}
                className="text-on-surface font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-base mr-2">settings</span>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-error font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-base mr-2">logout</span>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="hover:text-white text-inverse-primary/70 transition-colors duration-200 relative shrink-0">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full" />
          </button>
        </div>
      </div>
    </aside>
  );
}
