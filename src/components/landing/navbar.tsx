import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full px-4 sm:px-6 py-3 sm:py-4 h-14 sm:h-16 flex justify-between items-center bg-surface-container-lowest/80 backdrop-blur-xl">
      <Link href="/" className="flex items-center shrink-0">
        <Logo height={34} className="sm:hidden" />
        <Logo height={46} className="hidden sm:block" />
      </Link>

      <div className="hidden md:flex gap-8 items-center">
        <a
          href="#features"
          className="text-on-surface-variant hover:text-secondary transition-colors duration-200"
        >
          Features
        </a>
        <a
          href="#pricing"
          className="text-on-surface-variant hover:text-secondary transition-colors duration-200"
        >
          Pricing
        </a>
        <Link
          href="/pricing"
          className="text-on-surface-variant hover:text-secondary transition-colors duration-200"
        >
          Compare Plans
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <Link
          href="/login"
          className="px-3 sm:px-5 py-2 text-primary font-semibold hover:text-secondary transition-colors text-sm"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="px-3 sm:px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 transition-all text-sm whitespace-nowrap"
        >
          Start Free
        </Link>
      </div>
    </nav>
  );
}
