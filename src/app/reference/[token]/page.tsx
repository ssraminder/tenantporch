"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

type ReferenceData = {
  id: string;
  application_id: string;
  referee_name: string;
  status: string;
  applicant_name: string;
  property_address: string;
};

export default function ReferenceFormPage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [refData, setRefData] = useState<ReferenceData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [tenancyDuration, setTenancyDuration] = useState("");
  const [rentOnTime, setRentOnTime] = useState("");
  const [leaseViolations, setLeaseViolations] = useState(false);
  const [violationDetails, setViolationDetails] = useState("");
  const [maintainedWell, setMaintainedWell] = useState(true);
  const [noiseComplaints, setNoiseComplaints] = useState(false);
  const [wouldRentAgain, setWouldRentAgain] = useState(true);
  const [additionalComments, setAdditionalComments] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: ref } = await supabase
        .from("rp_reference_checks")
        .select("id, application_id, referee_name, status, token")
        .eq("token", token)
        .single();

      if (!ref) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (ref.status === "completed") {
        setCompleted(true);
        setLoading(false);
        return;
      }

      // Fetch applicant name and property address
      const { data: app } = await supabase
        .from("rp_tenant_applications")
        .select("first_name, last_name, rp_properties(address_line1, city)")
        .eq("id", ref.application_id)
        .single();

      const property = (app?.rp_properties as any) ?? {};

      setRefData({
        id: ref.id,
        application_id: ref.application_id,
        referee_name: ref.referee_name,
        status: ref.status,
        applicant_name: app
          ? `${app.first_name} ${app.last_name}`
          : "the applicant",
        property_address: property.address_line1
          ? `${property.address_line1}, ${property.city}`
          : "the property",
      });
      setLoading(false);
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refData) return;

    if (!tenancyDuration || !rentOnTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = {
        tenancy_duration: tenancyDuration,
        rent_on_time: rentOnTime,
        lease_violations: leaseViolations,
        violation_details: leaseViolations ? violationDetails : null,
        maintained_well: maintainedWell,
        noise_complaints: noiseComplaints,
        would_rent_again: wouldRentAgain,
        additional_comments: additionalComments || null,
      };

      const { error } = await supabase
        .from("rp_reference_checks")
        .update({
          response,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", refData.id);

      if (error) throw error;

      // Notify landlord
      const { data: app } = await supabase
        .from("rp_tenant_applications")
        .select("landlord_id, first_name, last_name")
        .eq("id", refData.application_id)
        .single();

      if (app) {
        await supabase.from("rp_notifications").insert({
          user_id: app.landlord_id,
          type: "general",
          title: "Reference Received",
          body: `Reference from ${refData.referee_name} received for ${app.first_name} ${app.last_name}.`,
          link: `/admin/applications/${refData.application_id}`,
        });
      }

      setCompleted(true);
      toast.success("Thank you for your response!");
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
            link_off
          </span>
          <h1 className="font-headline text-xl font-bold text-primary mb-2">
            Link Not Found
          </h1>
          <p className="text-sm text-on-surface-variant">
            This reference link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-4xl text-tertiary-fixed-dim">
              check_circle
            </span>
          </div>
          <h1 className="font-headline text-xl font-bold text-primary mb-2">
            Thank You!
          </h1>
          <p className="text-sm text-on-surface-variant">
            Your reference response has been submitted successfully.
          </p>
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

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-headline text-2xl font-bold text-primary">
            Rental Reference
          </h1>
          <p className="text-sm text-on-surface-variant mt-2">
            for {refData!.applicant_name}
          </p>
        </div>

        {/* Intro card */}
        <div className="bg-primary-fixed/20 rounded-2xl p-5 flex gap-3">
          <span className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5">
            info
          </span>
          <p className="text-sm text-on-surface leading-relaxed">
            You have been listed as a reference by{" "}
            <strong>{refData!.applicant_name}</strong> who is applying to rent
            at <strong>{refData!.property_address}</strong>. Your responses are
            confidential and will only be shared with the landlord.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 md:p-8 space-y-6">
            {/* Tenancy duration */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                How long did the tenant rent from you? *
              </label>
              <input
                type="text"
                value={tenancyDuration}
                onChange={(e) => setTenancyDuration(e.target.value)}
                placeholder="e.g. 2 years"
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            {/* Rent on time */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Was rent paid on time? *
              </label>
              <select
                value={rentOnTime}
                onChange={(e) => setRentOnTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              >
                <option value="">Select...</option>
                <option value="always">Always</option>
                <option value="usually">Usually</option>
                <option value="sometimes">Sometimes</option>
                <option value="rarely">Rarely</option>
              </select>
            </div>

            {/* Lease violations */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Were there any lease violations?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setLeaseViolations(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    !leaseViolations
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setLeaseViolations(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    leaseViolations
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                  }`}
                >
                  Yes
                </button>
              </div>
              {leaseViolations && (
                <textarea
                  value={violationDetails}
                  onChange={(e) => setViolationDetails(e.target.value)}
                  placeholder="Please describe the violations..."
                  rows={3}
                  className="w-full mt-3 px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>

            {/* Maintained well */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Did the tenant maintain the property well?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setMaintainedWell(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    maintainedWell
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setMaintainedWell(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    !maintainedWell
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Noise complaints */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Any noise or neighbour complaints?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setNoiseComplaints(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    !noiseComplaints
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setNoiseComplaints(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    noiseComplaints
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {/* Would rent again */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Would you rent to this person again?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setWouldRentAgain(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    wouldRentAgain
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRentAgain(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    !wouldRentAgain
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Additional comments */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Additional comments
              </label>
              <textarea
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Any additional information about this tenant..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Submit Reference
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-on-surface-variant">
          Powered by{" "}
          <Link href="/" className="font-bold text-primary hover:underline">
            TenantPorch
          </Link>
        </p>
      </div>
    </div>
  );
}
