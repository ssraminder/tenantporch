"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Save structured ID information for a tenant (admin-side).
 */
export async function saveTenantIdInfo(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, role")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser || rpUser.role !== "landlord") {
      return { success: false, error: "Not authorized" };
    }

    const tenantId = formData.get("tenant_id") as string;
    const idType = formData.get("id_type") as string;
    const idNumber = formData.get("id_number") as string;
    const idPlaceOfIssue = formData.get("id_place_of_issue") as string;
    const idExpiryDate = formData.get("id_expiry_date") as string;
    const idNameOnDocument = formData.get("id_name_on_document") as string;

    if (!tenantId || !idType || !idNumber || !idNameOnDocument) {
      return { success: false, error: "Required fields: ID type, number, and name on document" };
    }

    // Verify tenant belongs to landlord's properties
    const { data: properties } = await supabase
      .from("rp_properties")
      .select("id")
      .eq("landlord_id", rpUser.id);

    if (!properties || properties.length === 0) {
      return { success: false, error: "No properties found" };
    }

    const propertyIds = properties.map((p) => p.id);
    const { data: leases } = await supabase
      .from("rp_leases")
      .select("id")
      .in("property_id", propertyIds);

    const leaseIds = (leases ?? []).map((l) => l.id);
    if (leaseIds.length === 0) {
      return { success: false, error: "Tenant not found on your leases" };
    }

    const { data: link } = await supabase
      .from("rp_lease_tenants")
      .select("id")
      .eq("user_id", tenantId)
      .in("lease_id", leaseIds)
      .limit(1)
      .single();

    if (!link) {
      return { success: false, error: "Tenant not found on your leases" };
    }

    const { error: updateError } = await supabase
      .from("rp_users")
      .update({
        id_type: idType,
        id_number: idNumber,
        id_place_of_issue: idPlaceOfIssue || null,
        id_expiry_date: idExpiryDate || null,
        id_name_on_document: idNameOnDocument,
        id_document_status: "pending",
        id_uploaded_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Upload ID document photo for a tenant (admin-side).
 */
export async function uploadTenantId(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, role")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser || rpUser.role !== "landlord") {
      return { success: false, error: "Not authorized" };
    }

    const tenantId = formData.get("tenant_id") as string;
    const file = formData.get("file") as File;

    if (!tenantId || !file) {
      return { success: false, error: "Tenant ID and file are required" };
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "File must be JPEG, PNG, WebP, or PDF" };
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "File must be under 10MB" };
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `id-documents/${tenantId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("rp_users")
      .update({
        id_document_url: urlData.publicUrl,
        id_document_status: "pending",
        id_uploaded_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Approve or reject a tenant's ID document (admin-side).
 */
export async function reviewTenantId(tenantId: string, action: "approved" | "rejected") {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, role")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser || rpUser.role !== "landlord") {
      return { success: false, error: "Not authorized" };
    }

    const { error: updateError } = await supabase
      .from("rp_users")
      .update({
        id_document_status: action,
        id_reviewed_at: new Date().toISOString(),
        id_reviewed_by: rpUser.id,
      })
      .eq("id", tenantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Notify tenant
    await supabase.from("rp_notifications").insert({
      user_id: tenantId,
      type: "id_review",
      title: action === "approved" ? "ID Verified" : "ID Rejected",
      message:
        action === "approved"
          ? "Your identification document has been verified by your landlord."
          : "Your identification document was not accepted. Please upload a clearer photo or a different document.",
    });

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
