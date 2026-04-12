"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after a brief delay
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 2000);
  };

  if (success) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient text-center">
        <div className="w-16 h-16 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl text-on-tertiary-fixed-variant">
            check_circle
          </span>
        </div>
        <h1 className="font-headline text-2xl font-bold text-primary mb-4">
          Password Updated
        </h1>
        <p className="text-on-surface-variant text-sm">
          Your password has been reset successfully. Redirecting you now...
        </p>
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
          Set new password
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="password" className="text-on-surface font-medium">
            New Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="mt-1.5 bg-surface-container-lowest border-outline-variant/20 focus:border-secondary"
          />
        </div>

        <div>
          <Label htmlFor="confirm-password" className="text-on-surface font-medium">
            Confirm Password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your new password"
            required
            minLength={8}
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
          {loading ? "Updating..." : "Reset Password"}
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        <Link
          href="/login"
          className="text-secondary font-semibold hover:underline"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
