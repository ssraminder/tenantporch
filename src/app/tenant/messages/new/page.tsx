"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendTenantMessage } from "@/app/tenant/actions/message-actions";

export default function NewTenantMessagePage() {
  const router = useRouter();

  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError("Message body is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("subject", subject.trim());
      formData.set("body", body.trim());

      const result = await sendTenantMessage(formData);
      if (result.success) {
        toast.success("Message sent successfully");
        router.push("/tenant/messages");
      } else {
        setError(result.error ?? "Failed to send message.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/tenant/messages"
          className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            New Message
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Send a message to your landlord
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-error-container/30 text-on-error-container p-4 rounded-xl">
          <span className="material-symbols-outlined text-lg">error</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden"
      >
        <div className="p-6 md:p-8 space-y-6">
          {/* Recipient display (read-only) */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              To
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                person
              </span>
              <div className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface">
                Your Landlord
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 ml-1">
              Messages are automatically sent to your property landlord
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-outline-variant/15" />

          {/* Subject */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              Subject
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject..."
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">
              Message <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
                chat
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={6}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 md:px-8 py-5 bg-surface-container-low flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href="/tenant/messages"
            className="w-full sm:w-auto text-center px-6 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-primary text-on-primary px-8 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">
                  progress_activity
                </span>
                Sending...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">send</span>
                Send Message
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
