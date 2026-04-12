import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ...formData } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const supabase = await createClient();

    // Validate the token exists and is a public link placeholder
    const { data: existing } = await supabase
      .from("rp_tenant_applications")
      .select("id, property_id, landlord_id, is_public_link, status")
      .eq("application_url_token", token)
      .eq("is_public_link", true)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Invalid application link" }, { status: 404 });
    }

    // Get client info
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? "unknown";

    // Update the existing placeholder record with form data
    const { error: updateError } = await supabase
      .from("rp_tenant_applications")
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        current_address: formData.current_address || null,
        current_landlord_name: formData.current_landlord_name || null,
        current_landlord_phone: formData.current_landlord_phone || null,
        current_landlord_email: formData.current_landlord_email || null,
        current_rent: formData.current_rent ? Number(formData.current_rent) : null,
        current_lease_end: formData.current_lease_end || null,
        reason_for_leaving: formData.reason_for_leaving || null,
        previous_address: formData.previous_address || null,
        previous_landlord_name: formData.previous_landlord_name || null,
        previous_landlord_phone: formData.previous_landlord_phone || null,
        previous_landlord_email: formData.previous_landlord_email || null,
        employer_name: formData.employer_name || null,
        job_title: formData.job_title || null,
        employer_address: formData.employer_address || null,
        employer_phone: formData.employer_phone || null,
        employment_duration: formData.employment_duration || null,
        monthly_income: formData.monthly_income ? Number(formData.monthly_income) : null,
        additional_income: formData.additional_income ? Number(formData.additional_income) : null,
        additional_income_description: formData.additional_income_description || null,
        has_been_evicted: formData.has_been_evicted ?? false,
        eviction_details: formData.eviction_details || null,
        has_filed_bankruptcy: formData.has_filed_bankruptcy ?? false,
        bankruptcy_details: formData.bankruptcy_details || null,
        number_of_occupants: formData.number_of_occupants ? Number(formData.number_of_occupants) : 1,
        occupant_names: formData.occupant_names ?? [],
        has_pets: formData.has_pets ?? false,
        pet_details: formData.pet_details || null,
        is_smoker: formData.is_smoker ?? false,
        has_vehicle: formData.has_vehicle ?? false,
        vehicle_details: formData.vehicle_details || null,
        move_in_date: formData.move_in_date || null,
        desired_lease_term: formData.desired_lease_term || null,
        personal_reference_name: formData.personal_reference_name || null,
        personal_reference_phone: formData.personal_reference_phone || null,
        personal_reference_relationship: formData.personal_reference_relationship || null,
        consent_credit_check: formData.consent_credit_check ?? false,
        consent_reference_check: formData.consent_reference_check ?? false,
        consent_background_check: formData.consent_background_check ?? false,
        consent_pipa: formData.consent_pipa ?? false,
        applicant_signature: formData.applicant_signature || null,
        signature_date: new Date().toISOString().split("T")[0],
        ip_address: ip,
        user_agent: userAgent,
        status: "submitted",
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Application submit error:", updateError);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    // Notify landlord
    await supabase.from("rp_notifications").insert({
      user_id: existing.landlord_id,
      type: "general",
      title: "New Application Received",
      body: `${formData.first_name} ${formData.last_name} submitted a rental application.`,
      link: `/admin/applications/${existing.id}`,
    });

    return NextResponse.json({ success: true, applicationId: existing.id });
  } catch (err) {
    console.error("Application submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
