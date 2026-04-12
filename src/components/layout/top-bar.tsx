"use client";

import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/logo";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

export function TopBar({ user }: TopBarProps) {
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
    <header className="flex justify-between items-center w-full px-6 py-4 h-16 bg-surface-bright fixed top-0 z-50 shadow-ambient-sm lg:hidden">
      <div className="flex items-center gap-4">
        <Logo height={24} />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="hover:text-secondary transition-colors duration-200 relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full" />
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
            <Avatar className="h-8 w-8 border-2 border-surface-variant">
              <AvatarFallback className="bg-primary-container text-on-primary-container text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-surface-container-lowest/80 backdrop-blur-xl border-outline-variant/15 rounded-xl"
          >
            <DropdownMenuItem className="text-on-surface font-medium cursor-pointer">
              {user?.firstName} {user?.lastName}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-error font-medium cursor-pointer"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
