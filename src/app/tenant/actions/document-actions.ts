"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadTenantDocument(formData: FormData) {
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
      return { success: false, error: "Only tenants can upload documents here" };
    }

    // Find tenant's property/lease via rp_lease_tenants -> rp_leases
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
    const leaseId = leaseLink.lease_id;

    if (!propertyId) {
      return { success: false, error: "Property not found for your lease" };
    }

    // Get the file from formData
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;

    if (!file || file.size === 0) {
      return { success: false, error: "File is required" };
    }

    if (!title || !title.trim()) {
      return { success: false, error: "Document title is required" };
    }

    // Upload to Supabase Storage bucket 'documents'
    const filePath = `${propertyId}/${rpUser.id}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Create rp_documents row
    const { error: insertError } = await supabase
      .from("rp_documents")
      .insert({
        property_id: propertyId,
        lease_id: leaseId || null,
        uploaded_by_user_id: rpUser.id,
        title: title.trim(),
        category: "other",
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type || null,
        visible_to_tenant: true,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/tenant/documents");
    revalidatePath("/admin/documents");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
