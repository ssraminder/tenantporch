"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTenantProfile(formData: FormData) {
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
    const phone = formData.get("phone") as string;
    const emergencyContactName = formData.get("emergency_contact_name") as string;
    const emergencyContactPhone = formData.get("emergency_contact_phone") as string;

    // Update rp_users
    const { error: updateError } = await supabase
      .from("rp_users")
      .update({
        phone: phone || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
      })
      .eq("id", rpUser.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/tenant/profile");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Save structured ID information (tenant self-upload).
 */
export async function saveMyIdInfo(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser, error: rpUserError } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    const idType = formData.get("id_type") as string;
    const idNumber = formData.get("id_number") as string;
    const idPlaceOfIssue = formData.get("id_place_of_issue") as string;
    const idExpiryDate = formData.get("id_expiry_date") as string;
    const idNameOnDocument = formData.get("id_name_on_document") as string;

    if (!idType || !idNumber || !idNameOnDocument) {
      return { success: false, error: "Required fields: ID type, number, and name on document" };
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
      .eq("id", rpUser.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/tenant/profile");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Upload ID document photo (tenant self-upload).
 */
export async function uploadMyId(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser, error: rpUserError } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "File is required" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "File must be JPEG, PNG, WebP, or PDF" };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "File must be under 10MB" };
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `id-documents/${rpUser.id}/${Date.now()}.${ext}`;

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
      .eq("id", rpUser.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Notify landlord(s) about new ID upload
    const { data: leaseLinks } = await supabase
      .from("rp_lease_tenants")
      .select("rp_leases!inner(property_id, rp_properties!inner(landlord_id))")
      .eq("user_id", rpUser.id);

    if (leaseLinks && leaseLinks.length > 0) {
      const landlordIds = new Set<string>();
      for (const link of leaseLinks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const landlordId = (link.rp_leases as any)?.rp_properties?.landlord_id;
        if (landlordId) landlordIds.add(landlordId);
      }

      for (const landlordId of Array.from(landlordIds)) {
        await supabase.from("rp_notifications").insert({
          user_id: landlordId,
          type: "id_uploaded",
          title: "Tenant ID Uploaded",
          message: "A tenant has uploaded their identification document for review.",
        });
      }
    }

    revalidatePath("/tenant/profile");
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function changePassword(formData: FormData) {
  try {
    const supabase = await createClient();

    // Extract form fields
    const newPassword = formData.get("newPassword") as string;

    if (!newPassword || !newPassword.trim()) {
      return { success: false, error: "New password is required" };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
