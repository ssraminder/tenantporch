import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import Link from "next/link";
import { ApplicationFilters } from "./application-filters";

export default async function AdminApplications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // Fetch all applications for this landlord
  const { data: applications } = await supabase
    .from("rp_tenant_applications")
    .select(
      "id, first_name, last_name, email, phone, monthly_income, number_of_occupants, move_in_date, status, created_at, is_public_link, property_id, rp_properties(address_line1, city)"
    )
    .eq("landlord_id", rpUser.id)
    .order("created_at", { ascending: false });

  const allApps = (applications ?? []).map((app) => {
    const property = app.rp_properties as any;
    return {
      id: app.id,
      name: app.first_name
        ? `${app.first_name} ${app.last_name}`
        : "Pending applicant",
      email: app.email ?? "—",
      phone: app.phone ?? "—",
      propertyAddress: property?.address_line1 ?? "—",
      propertyCity: property?.city ?? "",
      monthlyIncome: app.monthly_income ? Number(app.monthly_income) : null,
      occupants: app.number_of_occupants ?? 1,
      moveInDate: app.move_in_date,
      status: app.status ?? "submitted",
      createdAt: app.created_at,
      isPlaceholder: app.is_public_link && !app.first_name,
    };
  });

  // Filter out placeholders (links generated but not yet filled)
  const submittedApps = allApps.filter((a) => !a.isPlaceholder);

  const statusCounts = {
    all: submittedApps.length,
    submitted: submittedApps.filter((a) => a.status === "submitted").length,
    reviewing: submittedApps.filter((a) => a.status === "reviewing").length,
    approved: submittedApps.filter((a) => a.status === "approved").length,
    declined: submittedApps.filter((a) => a.status === "declined").length,
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-2xl font-bold text-primary">
            Applications
          </h1>
          {statusCounts.submitted > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-secondary text-on-secondary text-xs font-bold">
              {statusCounts.submitted}
            </span>
          )}
        </div>
      </div>

      {/* Filters + List */}
      <ApplicationFilters
        applications={submittedApps}
        statusCounts={statusCounts}
      />
    </section>
  );
}
