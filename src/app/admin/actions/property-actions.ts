"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProperty(formData: FormData) {
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

    // Check plan limits
    const { data: landlordProfile, error: profileError } = await supabase
      .from("rp_landlord_profiles")
      .select("property_count, plan_id, rp_plans(max_properties)")
      .eq("user_id", rpUser.id)
      .single();

    if (profileError || !landlordProfile) {
      return { success: false, error: "Landlord profile not found" };
    }

    const maxProperties = (landlordProfile.rp_plans as any)?.max_properties ?? null;
    const currentCount = landlordProfile.property_count ?? 0;

    if (maxProperties !== null && currentCount >= maxProperties) {
      return {
        success: false,
        error: `You've reached your plan limit of ${maxProperties} properties. Please upgrade your plan to add more.`,
      };
    }

    // Extract form fields
    const addressLine1 = formData.get("address_line1") as string;
    const addressLine2 = formData.get("address_line2") as string;
    const city = formData.get("city") as string;
    const provinceState = formData.get("province_state") as string;
    const postalCode = formData.get("postal_code") as string;
    const countryCode = (formData.get("country_code") as string) || "CA";
    const unitDescription = formData.get("unit_description") as string;
    const stickerNumber = formData.get("sticker_number") as string;
    const monthlyRent = parseFloat(formData.get("monthly_rent") as string) || 0;
    const hasSeparateEntrance =
      formData.get("has_separate_entrance") === "true" ||
      formData.get("has_separate_entrance") === "on";
    const hasSeparateMailbox =
      formData.get("has_separate_mailbox") === "true" ||
      formData.get("has_separate_mailbox") === "on";
    const isFurnished =
      formData.get("is_furnished") === "true" ||
      formData.get("is_furnished") === "on";
    const parkingType = formData.get("parking_type") as string;
    const parkingSpots =
      parseFloat(formData.get("parking_spots") as string) || 0;
    const laundryType = formData.get("laundry_type") as string;
    const heatingType = formData.get("heating_type") as string;
    const coolingType = formData.get("cooling_type") as string;
    const wifiSsid = formData.get("wifi_ssid") as string;
    const wifiPassword = formData.get("wifi_password") as string;
    const petDeposit =
      parseFloat(formData.get("pet_deposit") as string) || 0;
    const storageIncluded =
      formData.get("storage_included") === "true" ||
      formData.get("storage_included") === "on";
    const yardAccess =
      formData.get("yard_access") === "true" ||
      formData.get("yard_access") === "on";

    // Validate required fields
    if (!addressLine1 || !city || !provinceState || !postalCode || !monthlyRent) {
      return {
        success: false,
        error: "Missing required fields: address, city, province/state, postal code, and monthly rent are required.",
      };
    }

    // Insert property
    const { data: property, error: insertError } = await supabase
      .from("rp_properties")
      .insert({
        landlord_id: rpUser.id,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        province_state: provinceState,
        postal_code: postalCode,
        country_code: countryCode,
        unit_description: unitDescription || null,
        sticker_number: stickerNumber || null,
        monthly_rent: monthlyRent,
        has_separate_entrance: hasSeparateEntrance,
        has_separate_mailbox: hasSeparateMailbox,
        is_furnished: isFurnished,
        parking_type: parkingType || null,
        parking_spots: parkingSpots,
        laundry_type: laundryType || null,
        heating_type: heatingType || null,
        cooling_type: coolingType || null,
        wifi_ssid: wifiSsid || null,
        wifi_password: wifiPassword || null,
        pet_deposit: petDeposit,
        storage_included: storageIncluded,
        yard_access: yardAccess,
        status: "vacant",
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Increment property_count on landlord profile
    await supabase
      .from("rp_landlord_profiles")
      .update({ property_count: currentCount + 1 })
      .eq("user_id", rpUser.id);

    revalidatePath("/admin/properties");
    revalidatePath("/admin/dashboard");

    return { success: true, propertyId: property.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updateProperty(propertyId: string, formData: FormData) {
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

    // Verify ownership
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

    // Extract form fields
    const updateData: Record<string, any> = {};

    const fields = [
      "address_line1",
      "address_line2",
      "city",
      "province_state",
      "postal_code",
      "country_code",
      "unit_description",
      "sticker_number",
      "parking_type",
      "laundry_type",
      "heating_type",
      "cooling_type",
      "wifi_ssid",
      "wifi_password",
    ];

    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null) {
        updateData[field] = (value as string) || null;
      }
    }

    const numericFields = [
      "monthly_rent",
      "parking_spots",
      "pet_deposit",
    ];

    for (const field of numericFields) {
      const value = formData.get(field);
      if (value !== null) {
        updateData[field] = parseFloat(value as string) || 0;
      }
    }

    const booleanFields = [
      "has_separate_entrance",
      "has_separate_mailbox",
      "is_furnished",
      "storage_included",
      "yard_access",
    ];

    for (const field of booleanFields) {
      const value = formData.get(field);
      if (value !== null) {
        updateData[field] = value === "true" || value === "on";
      }
    }

    const { error: updateError } = await supabase
      .from("rp_properties")
      .update(updateData)
      .eq("id", propertyId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${propertyId}`);

    return { success: true, propertyId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteProperty(propertyId: string) {
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

    // Verify ownership
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

    // Check if property has active leases
    const { data: activeLeases } = await supabase
      .from("rp_leases")
      .select("id")
      .eq("property_id", propertyId)
      .eq("status", "active")
      .limit(1);

    if (activeLeases && activeLeases.length > 0) {
      return {
        success: false,
        error: "Cannot delete property with active leases",
      };
    }

    // Delete property
    const { error: deleteError } = await supabase
      .from("rp_properties")
      .delete()
      .eq("id", propertyId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Decrement landlord_profiles.property_count
    const { data: landlordProfile } = await supabase
      .from("rp_landlord_profiles")
      .select("property_count")
      .eq("user_id", rpUser.id)
      .single();

    if (landlordProfile) {
      const newCount = Math.max((landlordProfile.property_count ?? 1) - 1, 0);
      await supabase
        .from("rp_landlord_profiles")
        .update({ property_count: newCount })
        .eq("user_id", rpUser.id);
    }

    revalidatePath("/admin/properties");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
