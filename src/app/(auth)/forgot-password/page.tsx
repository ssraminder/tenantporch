"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient text-center">
        <div className="w-16 h-16 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl text-on-tertiary-fixed-variant">
            mark_email_read
          </span>
        </div>
        <h1 className="font-headline text-2xl font-bold text-primary mb-4">
          Check your email
        </h1>
        <p className="text-on-surface-variant mb-6 text-sm">
          We sent a password reset link to <strong>{email}</strong>.
          Click the link in the email to reset your password.
        </p>
        <Link
          href="/login"
          className="text-secondary font-semibold text-sm hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient">
      <div className="flex justify-center mb-6">
        <Logo height={44} />
      </div>
      <div className="text-center mb-8">
        <h1 className="font-headline text-xl font-bold text-primary">
          Reset your password
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        {error && (
          <p className="text-error text-sm font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary font-bold rounded-xl py-3 hover:opacity-90"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-secondary font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
