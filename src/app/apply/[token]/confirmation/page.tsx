import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ApplicationConfirmation({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("rp_tenant_applications")
    .select(
      "id, first_name, last_name, created_at, property_id, rp_properties(address_line1, city, province_state)"
    )
    .eq("application_url_token", token)
    .single();

  if (!app) return notFound();

  const property = app.rp_properties as any;
  const submittedDate = app.created_at
    ? new Date(app.created_at).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Today";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-8 md:p-10 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-tertiary-fixed-dim">
              check_circle
            </span>
          </div>

          <h1 className="font-headline text-2xl font-bold text-primary mb-2">
            Application Submitted!
          </h1>
          <p className="text-sm text-on-surface-variant mb-8">
            Your rental application has been received. The landlord will review
            it and contact you with next steps.
          </p>

          {/* Details card */}
          <div className="bg-surface-container-low rounded-2xl p-5 space-y-3 text-left mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-lg">apartment</span>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                  Property
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {property?.address_line1 ?? "—"}, {property?.city ?? ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                  Submitted
                </p>
                <p className="text-sm font-semibold text-on-surface">{submittedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-lg">tag</span>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                  Reference #
                </p>
                <p className="text-sm font-semibold text-on-surface font-mono">
                  {app.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant">
            Keep this page for your records. If you have questions, contact the
            landlord directly.
          </p>
        </div>

        {/* Footer */}
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
