"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Clear must_change_password flag
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("rp_users")
          .update({ must_change_password: false })
          .eq("auth_id", user.id);
      }

      toast.success("Password updated successfully!");
      router.push("/tenant/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleKeepPassword() {
    setSkipping(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("rp_users")
          .update({ must_change_password: false })
          .eq("auth_id", user.id);
      }
      router.push("/tenant/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSkipping(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo height={44} />
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">
                lock_reset
              </span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">
              Set Your Password
            </h2>
            <p className="text-sm text-on-surface-variant">
              Welcome! Please create a new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-bold text-primary mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  lock
                </span>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  placeholder="Type your new password again"
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
                  Updating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    check
                  </span>
                  Set Password
                </>
              )}
            </button>
          </form>

          {/* Keep current password link */}
          <div className="text-center mt-4">
            <button
              onClick={handleKeepPassword}
              disabled={skipping}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              {skipping ? "Redirecting..." : "Keep current password"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Powered by{" "}
          <Link href="/" className="font-bold text-primary hover:underline">
            TenantPorch
          </Link>
        </p>
      </div>
    </div>
  );
}
