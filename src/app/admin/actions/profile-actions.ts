"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
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
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const phone = formData.get("phone") as string;

    // Update rp_users
    const { error: updateError } = await supabase
      .from("rp_users")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
      })
      .eq("id", rpUser.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updateCompanyInfo(formData: FormData) {
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
    const companyName = formData.get("company_name") as string;
    const businessNumber = formData.get("business_number") as string;
    const currencyCode = formData.get("currency_code") as string | null;
    const timezone = formData.get("timezone") as string | null;

    // Build landlord profile update payload
    const landlordUpdate: Record<string, string | null> = {};
    if (companyName !== null) landlordUpdate.company_name = companyName || null;
    if (businessNumber !== null) landlordUpdate.business_number = businessNumber || null;
    if (currencyCode) landlordUpdate.currency_code = currencyCode;

    // Update rp_landlord_profiles (if there are fields to update)
    if (Object.keys(landlordUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from("rp_landlord_profiles")
        .update(landlordUpdate)
        .eq("user_id", rpUser.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    }

    // Update rp_users for currency/timezone preferences
    const userUpdate: Record<string, string | null> = {};
    if (currencyCode) userUpdate.preferred_currency = currencyCode;
    if (timezone) userUpdate.timezone = timezone;

    if (Object.keys(userUpdate).length > 0) {
      const { error: userUpdateError } = await supabase
        .from("rp_users")
        .update(userUpdate)
        .eq("id", rpUser.id);

      if (userUpdateError) {
        return { success: false, error: userUpdateError.message };
      }
    }

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
