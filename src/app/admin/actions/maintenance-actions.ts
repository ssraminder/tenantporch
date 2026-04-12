"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function createMaintenanceRequest(formData: FormData) {
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

    // Extract form fields
    const propertyId = formData.get("property_id") as string;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const urgency = formData.get("urgency") as string;
    const description = formData.get("description") as string;

    if (!propertyId || !title) {
      return { success: false, error: "Property ID and title are required" };
    }

    // Verify property ownership
    const { data: property, error: propertyError } = await supabase
      .from("rp_properties")
      .select("id, landlord_id")
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      return { success: false, error: "Property not found" };
    }

    if (property.landlord_id !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    // Insert maintenance request (landlord-initiated, so tenant_id is null)
    const { data: request, error: insertError } = await supabase
      .from("rp_maintenance_requests")
      .insert({
        property_id: propertyId,
        tenant_id: null,
        title,
        category: category || null,
        urgency: urgency || null,
        description: description || null,
        status: "submitted",
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/admin/maintenance");
    revalidatePath(`/admin/properties/${propertyId}`);
    revalidatePath("/admin/dashboard");

    return { success: true, requestId: request.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updateMaintenanceStatus(
  requestId: string,
  status: string
) {
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

    // Verify request belongs to landlord's property
    const { data: request, error: requestError } = await supabase
      .from("rp_maintenance_requests")
      .select("id, property_id, tenant_id, title, rp_properties(landlord_id)")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Maintenance request not found" };
    }

    const landlordId = (request.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own the property associated with this request" };
    }

    // Update status
    const { error: updateError } = await supabase
      .from("rp_maintenance_requests")
      .update({ status })
      .eq("id", requestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/maintenance");
    revalidatePath(`/admin/maintenance/${requestId}`);
    revalidatePath(`/admin/properties/${request.property_id}`);
    revalidatePath("/admin/dashboard");

    // Notify the tenant about the status change
    const tenantId = (request as any).tenant_id;
    const requestTitle = (request as any).title || "your request";
    if (tenantId) {
      const urgencyMap: Record<string, string> = {
        completed: "normal",
        in_progress: "normal",
        on_hold: "low",
        cancelled: "normal",
        submitted: "low",
      };
      await createNotification(supabase, {
        userId: tenantId,
        title: "Maintenance Update",
        body: `Your request '${requestTitle}' has been updated to ${status}.`,
        type: "maintenance",
        urgency: urgencyMap[status] ?? "normal",
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
