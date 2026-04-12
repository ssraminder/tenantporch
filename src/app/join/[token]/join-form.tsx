"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function JoinForm({
  token,
  email,
  firstName,
  lastName,
}: {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password.trim()) {
      toast.error("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      // Sign in with the new credentials
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        toast.success("Account created! Please log in with your credentials.");
        router.push("/login");
        return;
      }

      setDone(true);
      toast.success("Welcome to TenantPorch!");
      setTimeout(() => {
        router.push("/tenant/dashboard");
        router.refresh();
      }, 1500);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create account"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed/30 flex items-center justify-center mx-auto mb-4">
          <span
            className="material-symbols-outlined text-3xl text-on-tertiary-fixed-variant"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <h3 className="font-headline text-lg font-bold text-primary mb-1">
          Account Created!
        </h3>
        <p className="text-sm text-on-surface-variant">
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-bold text-primary mb-2">
          Email
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            mail
          </span>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface-variant cursor-not-allowed"
          />
        </div>
      </div>

      {/* Name (read-only) */}
      <div>
        <label className="block text-sm font-bold text-primary mb-2">
          Name
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            person
          </span>
          <input
            type="text"
            value={`${firstName} ${lastName}`}
            readOnly
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface-variant cursor-not-allowed"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-bold text-primary mb-2"
        >
          Create Password
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            lock
          </span>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-bold text-primary mb-2"
        >
          Confirm Password
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            lock
          </span>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Type your password again"
            required
            minLength={8}
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">
              progress_activity
            </span>
            Creating Account...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">
              how_to_reg
            </span>
            Create My Account
          </>
        )}
      </button>
    </form>
  );
}
