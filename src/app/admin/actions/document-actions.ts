"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadDocument(formData: FormData) {
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
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    const propertyId = formData.get("property_id") as string;
    const category = formData.get("category") as string;
    const title = formData.get("title") as string;
    const visibleToTenant = formData.get("visible_to_tenant") === "true";
    const file = formData.get("file") as File | null;

    if (!propertyId || !title || !category) {
      return { success: false, error: "Property, title, and category are required" };
    }

    if (!file || file.size === 0) {
      return { success: false, error: "Please select a file to upload" };
    }

    // Verify property ownership
    const { data: property } = await supabase
      .from("rp_properties")
      .select("id")
      .eq("id", propertyId)
      .eq("landlord_id", rpUser.id)
      .single();

    if (!property) {
      return { success: false, error: "Property not found or access denied" };
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${propertyId}/${Date.now()}_${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(uploadData.path);

    // Insert document record
    const { error: insertError } = await supabase
      .from("rp_documents")
      .insert({
        property_id: propertyId,
        uploaded_by: rpUser.id,
        category,
        title,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        visible_to_tenant: visibleToTenant,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/admin/documents");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteDocument(documentId: string) {
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
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Get the document and verify ownership
    const { data: doc } = await supabase
      .from("rp_documents")
      .select("id, file_url, property_id, rp_properties(landlord_id)")
      .eq("id", documentId)
      .single();

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    const landlordId = (doc.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "Access denied" };
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("rp_documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath("/admin/documents");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
