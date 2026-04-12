import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ApplicationForm } from "./application-form";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the application link by token
  const { data: app } = await supabase
    .from("rp_tenant_applications")
    .select(
      "id, property_id, landlord_id, application_url_token, is_public_link, status, first_name"
    )
    .eq("application_url_token", token)
    .eq("is_public_link", true)
    .single();

  if (!app || !app.property_id) return notFound();

  // If already submitted, redirect to confirmation
  if (app.status !== "submitted" && app.first_name) {
    // Already filled — show confirmation
  }

  // Fetch property details
  const { data: property } = await supabase
    .from("rp_properties")
    .select("id, address_line1, city, province_state, postal_code, monthly_rent")
    .eq("id", app.property_id)
    .single();

  if (!property) return notFound();

  // Fetch landlord first name only (privacy)
  const { data: landlord } = await supabase
    .from("rp_users")
    .select("first_name")
    .eq("id", app.landlord_id)
    .single();

  return (
    <div className="min-h-screen bg-surface">
      <ApplicationForm
        token={token}
        property={{
          address: property.address_line1,
          city: property.city,
          province: property.province_state,
          postalCode: property.postal_code,
          rent: Number(property.monthly_rent ?? 0),
        }}
        landlordFirstName={landlord?.first_name ?? "Your landlord"}
      />
    </div>
  );
}
