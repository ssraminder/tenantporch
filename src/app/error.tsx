"use client";

import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message =
    error.message && error.message.length > 200
      ? error.message.slice(0, 200) + "..."
      : error.message || "An unexpected error occurred.";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-md bg-surface-container rounded-3xl shadow-ambient-sm p-8 text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error-container">
          <span className="material-symbols-outlined text-4xl text-on-error-container">
            error_outline
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Something went wrong
        </h1>

        {/* Error message */}
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
