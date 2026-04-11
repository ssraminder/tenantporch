"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const role = "landlord" as const;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // rp_users + rp_landlord_profiles are created automatically
    // by the database trigger on auth.users insert

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-ambient text-center">
        <h1 className="font-headline text-2xl font-bold text-primary mb-4">
          Check your email
        </h1>
        <p className="text-on-surface-variant mb-6">
          We sent a confirmation link to <strong>{email}</strong>. Please
          verify your email to continue.
        </p>
        <Link href="/login">
          <Button
            variant="ghost"
            className="text-secondary font-semibold"
          >
            Back to login
          </Button>
        </Link>
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
          Create your landlord account
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName" className="text-on-surface font-medium">
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
            <Label htmlFor="lastName" className="text-on-surface font-medium">
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

        {error && (
          <p className="text-error text-sm font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary font-bold rounded-xl py-3 hover:opacity-90"
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        Already have an account?{" "}
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
