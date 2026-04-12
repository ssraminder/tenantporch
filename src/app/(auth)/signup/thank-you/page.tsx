"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function SignupThankYouPage() {
  return (
    <Suspense>
      <ThankYouContent />
    </Suspense>
  );
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planSlug = searchParams.get("plan") ?? "";
  const planName = PLAN_NAMES[planSlug] ?? planSlug;

  // Push GTM dataLayer event
  useEffect(() => {
    if (typeof window !== "undefined" && planSlug) {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: "signup_complete",
        plan: planSlug,
      });
    }
  }, [planSlug]);

  // Auto-redirect after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/admin/dashboard");
    }, 8000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 shadow-ambient text-center">
      <div className="flex justify-center mb-6">
        <Logo height={44} />
      </div>

      <div className="w-16 h-16 bg-tertiary-fixed/15 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-tertiary-fixed-dim text-4xl">
          celebration
        </span>
      </div>

      <h1 className="font-headline text-2xl font-bold text-primary mb-3">
        Welcome to TenantPorch!
      </h1>

      {planName && (
        <p className="text-on-surface-variant mb-2">
          You&apos;re all set with the{" "}
          <span className="font-semibold text-secondary">{planName}</span> plan.
        </p>
      )}

      <p className="text-sm text-on-surface-variant mb-8">
        Your dashboard is ready. Let&apos;s get your first property set up.
      </p>

      <Link href="/admin/dashboard">
        <Button className="bg-primary text-on-primary font-bold rounded-xl px-8 py-3 hover:opacity-90">
          <span className="material-symbols-outlined text-lg mr-1.5">
            arrow_forward
          </span>
          Go to Dashboard
        </Button>
      </Link>

      <p className="text-xs text-on-surface-variant/50 mt-6">
        Redirecting automatically in a few seconds...
      </p>
    </div>
  );
}
