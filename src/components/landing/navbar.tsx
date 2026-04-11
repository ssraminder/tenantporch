import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full px-6 py-4 h-16 flex justify-between items-center bg-surface-container-lowest/80 backdrop-blur-xl">
      <Link
        href="/"
        className="text-xl font-headline font-bold text-primary tracking-tight"
      >
        TenantPorch
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

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden sm:inline-flex px-5 py-2 text-primary font-semibold hover:text-secondary transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 transition-all"
        >
          Start Free
        </Link>
      </div>
    </nav>
  );
}
