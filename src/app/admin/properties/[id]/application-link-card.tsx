"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function ApplicationLinkCard({
  propertyId,
  landlordId,
  propertyAddress,
  existingToken,
}: {
  propertyId: string;
  landlordId: string;
  propertyAddress: string;
  existingToken: string | null;
}) {
  const [token, setToken] = useState(existingToken);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  const appUrl = token
    ? `${window.location.origin}/apply/${token}`
    : null;

  async function generateLink() {
    setGenerating(true);
    try {
      const { data, error } = await supabase
        .from("rp_tenant_applications")
        .insert({
          property_id: propertyId,
          landlord_id: landlordId,
          first_name: "",
          last_name: "",
          email: "",
          is_public_link: true,
          status: "submitted",
        })
        .select("application_url_token")
        .single();

      if (error) throw error;
      setToken(data.application_url_token);
      toast.success("Application link generated!");
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!appUrl) return;
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  function shareEmail() {
    if (!appUrl) return;
    const subject = encodeURIComponent(`Rental Application — ${propertyAddress}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease fill out the rental application for ${propertyAddress} using the link below:\n\n${appUrl}\n\nThank you!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  function shareSMS() {
    if (!appUrl) return;
    const body = encodeURIComponent(
      `Hi! Please fill out the rental application for ${propertyAddress}: ${appUrl}`
    );
    window.open(`sms:?body=${body}`);
  }

  function shareWhatsApp() {
    if (!appUrl) return;
    const text = encodeURIComponent(
      `Hi! Please fill out the rental application for ${propertyAddress}: ${appUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
      <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">assignment</span>
        <h2 className="font-headline font-bold text-lg">Application Link</h2>
      </div>

      <div className="p-6 md:p-8 space-y-4">
        {token && appUrl ? (
          <>
            <p className="text-sm text-on-surface-variant">
              Share this link with potential tenants to receive applications.
            </p>

            {/* Link display */}
            <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
                link
              </span>
              <p className="text-xs text-on-surface font-mono truncate flex-1">
                {appUrl}
              </p>
              <button
                onClick={copyLink}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-opacity"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Share buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={shareEmail}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base">email</span>
                Email
              </button>
              <button
                onClick={shareSMS}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base">sms</span>
                SMS
              </button>
              <button
                onClick={shareWhatsApp}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                WhatsApp
              </button>
            </div>

            {/* Regenerate */}
            <button
              onClick={generateLink}
              disabled={generating}
              className="text-xs text-primary font-medium hover:underline underline-offset-2 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate new link"}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-outline-variant text-3xl mb-3 block">
              link
            </span>
            <p className="text-sm text-on-surface-variant mb-4">
              Generate a shareable link for potential tenants to apply.
            </p>
            <button
              onClick={generateLink}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">add_link</span>
              {generating ? "Generating..." : "Generate Application Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
