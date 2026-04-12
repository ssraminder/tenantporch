"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTenantMaintenanceRequest(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Look up rp_users record
    const { data: rpUser, error: rpUserError } = await supabase
      .from("rp_users")
      .select("id, role")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    if (rpUser.role !== "tenant" && rpUser.role !== "occupant") {
      return { success: false, error: "Only tenants can submit maintenance requests" };
    }

    // Find tenant's property via rp_lease_tenants -> rp_leases
    const { data: leaseLink, error: leaseLinkError } = await supabase
      .from("rp_lease_tenants")
      .select("lease_id, rp_leases!inner(id, property_id, status)")
      .eq("user_id", rpUser.id)
      .in("rp_leases.status", ["active", "draft"])
      .limit(1)
      .single();

    if (leaseLinkError || !leaseLink) {
      return { success: false, error: "No active lease found for your account" };
    }

    const propertyId = (leaseLink.rp_leases as any)?.property_id;
    if (!propertyId) {
      return { success: false, error: "Property not found for your lease" };
    }

    // Extract form fields
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const urgency = formData.get("urgency") as string;
    const description = formData.get("description") as string;

    // Validate required fields
    if (!title || !title.trim()) {
      return { success: false, error: "Title is required" };
    }

    if (!description || !description.trim()) {
      return { success: false, error: "Description is required" };
    }

    // Insert maintenance request
    const { data: request, error: insertError } = await supabase
      .from("rp_maintenance_requests")
      .insert({
        property_id: propertyId,
        tenant_id: rpUser.id,
        title: title.trim(),
        category: category || null,
        urgency: urgency || null,
        description: description.trim(),
        status: "submitted",
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/tenant/maintenance");
    revalidatePath("/admin/maintenance");

    return { success: true, requestId: request.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function addMaintenanceUpdate(requestId: string, message: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Look up rp_users record
    const { data: rpUser, error: rpUserError } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    if (!message || !message.trim()) {
      return { success: false, error: "Message is required" };
    }

    // Verify tenant owns this request
    const { data: request, error: requestError } = await supabase
      .from("rp_maintenance_requests")
      .select("id, tenant_id, description")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Maintenance request not found" };
    }

    if (request.tenant_id !== rpUser.id) {
      return { success: false, error: "You do not have access to this maintenance request" };
    }

    // Append update to description with timestamp
    const timestamp = new Date().toISOString();
    const existingDescription = request.description || "";
    const updatedDescription = `${existingDescription}\n\n--- Tenant Update (${timestamp}) ---\n${message.trim()}`;

    const { error: updateError } = await supabase
      .from("rp_maintenance_requests")
      .update({ description: updatedDescription })
      .eq("id", requestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/tenant/maintenance/${requestId}`);
    revalidatePath("/tenant/maintenance");
    revalidatePath("/admin/maintenance");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
