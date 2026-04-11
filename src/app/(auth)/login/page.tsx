"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMagicLinkSent(true);
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient text-center">
        <h1 className="font-headline text-2xl font-bold text-primary mb-4">
          Check your email
        </h1>
        <p className="text-on-surface-variant mb-6">
          We sent a magic link to <strong>{email}</strong>. Click the link to
          sign in.
        </p>
        <Button
          variant="ghost"
          onClick={() => setMagicLinkSent(false)}
          className="text-secondary font-semibold"
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient">
      <div className="text-center mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-primary italic">
          TenantPorch
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">
          Your front porch to smarter renting.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <Label htmlFor="email" className="text-on-surface font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="mt-1.5 bg-surface-container-lowest border-outline-variant/20 focus:border-secondary"
          />
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
            placeholder="Your password"
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
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-container-lowest px-2 text-on-surface-variant">
            or
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleMagicLink}
        disabled={loading}
        className="w-full border-outline-variant/20 text-primary font-semibold rounded-xl py-3"
      >
        Send Magic Link
      </Button>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-secondary font-semibold hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
