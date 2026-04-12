"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free: [
    "1 property included",
    "Tenant portal & messaging",
    "e-Transfer rent tracking",
    "Maintenance requests",
  ],
  starter: [
    "3 properties included",
    "PAD auto-debit ($10/txn)",
    "Unlimited e-signatures",
    "Custom lease builder",
  ],
  growth: [
    "10 properties included",
    "CRA T776 tax export",
    "Lease renewal workflow",
    "NOI dashboard",
  ],
  pro: [
    "20 properties included",
    "All add-ons included",
    "API access & webhooks",
    "Advanced analytics",
  ],
};

type PlanData = {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  included_properties: number;
  overage_rate: number;
};

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedPlan = searchParams.get("plan");

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const totalSteps = preselectedPlan ? 3 : 4;

  // Fetch plans when reaching step 4 (or preload for banner)
  useEffect(() => {
    if (preselectedPlan || step === 4) {
      fetchPlans();
    }
  }, [preselectedPlan, step]);

  async function fetchPlans() {
    if (plans.length > 0) return;
    setPlansLoading(true);
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      if (Array.isArray(data)) setPlans(data);
    } catch {
      // Plans will show empty — not critical for steps 1-3
    } finally {
      setPlansLoading(false);
    }
  }

  const preselectedPlanData = plans.find((p) => p.slug === preselectedPlan);

  // ─── Step 1: Name & Email ───
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check if email exists
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();

      if (checkData.exists) {
        setError("This email is already registered.");
        setLoading(false);
        return;
      }

      // Send OTP via custom API (uses Resend)
      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName }),
      });
      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        setError(otpData.error ?? "Failed to send verification code");
        setLoading(false);
        return;
      }

      setStep(2);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 2: Verify OTP ───
  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        setLoading(false);
        return;
      }

      setStep(3);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to resend code");
    } else {
      setError("");
      setOtpCode("");
    }
  }

  // ─── Step 3: Set Password ───
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Create the user account via admin API
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create account");
        setLoading(false);
        return;
      }

      // Sign in with the new credentials
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // If plan is pre-selected, skip step 4
      if (preselectedPlan) {
        await handlePlanSelect(preselectedPlan);
      } else {
        setStep(4);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 4 / Plan Selection ───
  async function handlePlanSelect(planSlug: string) {
    setLoading(true);
    setError("");

    try {
      if (planSlug === "free") {
        router.push("/admin/dashboard");
        return;
      }

      // Paid plan → Stripe checkout
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug,
          successUrl: "/signup/thank-you",
          cancelUrl: preselectedPlan
            ? `/signup?plan=${preselectedPlan}`
            : "/signup?step=4",
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        // Plan updated directly (no stripe_price_id)
        router.push("/admin/dashboard");
      } else {
        setError(data.error ?? "Could not start checkout");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 shadow-ambient">
      <div className="flex justify-center mb-6">
        <Logo height={44} />
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === step
                ? "w-8 bg-secondary"
                : s < step
                  ? "w-2 bg-secondary/60"
                  : "w-2 bg-outline-variant/20"
            }`}
          />
        ))}
      </div>

      {/* Pre-selected plan badge */}
      {preselectedPlan && preselectedPlanData && step <= 3 && (
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">
              workspace_premium
            </span>
            {preselectedPlanData.name} Plan — $
            {preselectedPlanData.base_price}/mo
          </span>
        </div>
      )}

      {/* ─── Step 1: Name & Email ─── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-5">
          <div className="text-center mb-2">
            <h1 className="font-headline text-xl font-bold text-primary">
              Create your account
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Start managing your properties
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="firstName"
                className="text-on-surface font-medium"
              >
                First name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1.5 bg-surface-container-lowest border-outline-variant/20 focus:border-secondary"
              />
            </div>
            <div>
              <Label
                htmlFor="lastName"
                className="text-on-surface font-medium"
              >
                Last name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1.5 bg-surface-container-lowest border-outline-variant/20 focus:border-secondary"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-on-surface font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 bg-surface-container-lowest border-outline-variant/20 focus:border-secondary"
            />
          </div>

          {error && (
            <p className="text-error text-sm font-medium">
              {error}{" "}
              {error.includes("already registered") && (
                <Link
                  href="/login"
                  className="text-secondary font-semibold hover:underline"
                >
                  Sign in instead
                </Link>
              )}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold rounded-xl py-3 hover:opacity-90"
          >
            {loading ? "Sending code..." : "Continue"}
          </Button>

          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-secondary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}

      {/* ─── Step 2: OTP Verification ─── */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-5">
          <div className="text-center mb-2">
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-3xl">
                mark_email_read
              </span>
            </div>
            <h1 className="font-headline text-xl font-bold text-primary">
              Verify your email
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Enter the 6-digit code sent to{" "}
              <strong className="text-on-surface">{email}</strong>
            </p>
          </div>

          <div>
            <Label htmlFor="otp" className="text-on-surface font-medium">
              Verification code
            </Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="000000"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              className="mt-1.5 bg-surface-container-lowest border-outline-variant/20 focus:border-secondary text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>

          {error && (
            <p className="text-error text-sm font-medium">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full bg-primary text-on-primary font-bold rounded-xl py-3 hover:opacity-90"
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <p className="text-center text-sm text-on-surface-variant">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-secondary font-semibold hover:underline"
            >
              Resend code
            </button>
          </p>
        </form>
      )}

      {/* ─── Step 3: Set Password ─── */}
      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-5">
          <div className="text-center mb-2">
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-3xl">
                lock
              </span>
            </div>
            <h1 className="font-headline text-xl font-bold text-primary">
              Set your password
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Choose a secure password for your account
            </p>
          </div>

          <div>
            <Label htmlFor="password" className="text-on-surface font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              minLength={6}
              required
              className="mt-1.5 bg-surface-container-lowest border-outline-variant/20 focus:border-secondary"
            />
          </div>

          <div>
            <Label
              htmlFor="confirmPassword"
              className="text-on-surface font-medium"
            >
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              minLength={6}
              required
              className="mt-1.5 bg-surface-container-lowest border-outline-variant/20 focus:border-secondary"
            />
          </div>

          {error && (
            <p className="text-error text-sm font-medium">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold rounded-xl py-3 hover:opacity-90"
          >
            {loading
              ? preselectedPlan
                ? "Setting up..."
                : "Setting password..."
              : preselectedPlan
                ? "Continue to payment"
                : "Set Password"}
          </Button>
        </form>
      )}

      {/* ─── Step 4: Plan Selection ─── */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="text-center mb-2">
            <h1 className="font-headline text-xl font-bold text-primary">
              Choose your plan
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Start free or pick a plan that fits your portfolio
            </p>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {plans
                .filter((p) => p.slug !== "enterprise")
                .map((plan) => {
                  const highlights = PLAN_HIGHLIGHTS[plan.slug] ?? [];
                  const isRecommended = plan.slug === "starter";

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border p-5 transition-all ${
                        isRecommended
                          ? "border-secondary bg-secondary/5 shadow-ambient-sm"
                          : "border-outline-variant/15 hover:border-outline-variant/30"
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-2.5 right-4 bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">
                          Recommended
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-base font-bold text-on-surface">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-on-surface-variant">
                            {plan.base_price > 0 ? (
                              <>
                                <span className="text-lg font-bold text-primary">
                                  ${plan.base_price}
                                </span>
                                /mo
                              </>
                            ) : (
                              <span className="text-lg font-bold text-primary">
                                Free
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handlePlanSelect(plan.slug)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            isRecommended
                              ? "bg-secondary text-on-secondary hover:opacity-90"
                              : plan.slug === "free"
                                ? "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                                : "bg-primary text-on-primary hover:opacity-90"
                          }`}
                        >
                          {loading
                            ? "..."
                            : plan.slug === "free"
                              ? "Start Free"
                              : "Get Started"}
                        </button>
                      </div>

                      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {highlights.map((h) => (
                          <li
                            key={h}
                            className="flex items-start gap-1.5 text-xs text-on-surface-variant"
                          >
                            <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm shrink-0 mt-px">
                              check
                            </span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </div>
          )}

          {error && (
            <p className="text-error text-sm font-medium text-center">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
