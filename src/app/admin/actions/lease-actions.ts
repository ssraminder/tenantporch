"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { generateAlbertaLeaseContent } from "@/lib/lease-templates/alberta";

export async function createLease(formData: FormData) {
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
    const leaseType = formData.get("lease_type") as string;
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;
    const monthlyRent = parseFloat(formData.get("monthly_rent") as string) || 0;
    const currencyCode = (formData.get("currency_code") as string) || "CAD";
    const securityDeposit =
      parseFloat(formData.get("security_deposit") as string) || 0;
    const depositPaidDate = formData.get("deposit_paid_date") as string;
    const utilitySplitPercent =
      parseFloat(formData.get("utility_split_percent") as string) || 40;
    const internetIncluded =
      formData.get("internet_included") === "true" ||
      formData.get("internet_included") === "on";
    const padEnabled =
      formData.get("pad_enabled") === "true" ||
      formData.get("pad_enabled") === "on";
    const petsAllowed =
      formData.get("pets_allowed") === "true" ||
      formData.get("pets_allowed") === "on";
    const smokingAllowed =
      formData.get("smoking_allowed") === "true" ||
      formData.get("smoking_allowed") === "on";
    const maxOccupants =
      parseFloat(formData.get("max_occupants") as string) || 3;
    const lateFeeType =
      (formData.get("late_fee_type") as string) || "flat";
    const lateFeeAmount =
      parseFloat(formData.get("late_fee_amount") as string) || 50;

    if (!propertyId) {
      return { success: false, error: "Property ID is required" };
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

    // Check no other active lease exists for this property
    const { data: existingLease } = await supabase
      .from("rp_leases")
      .select("id")
      .eq("property_id", propertyId)
      .eq("status", "active")
      .maybeSingle();

    if (existingLease) {
      return {
        success: false,
        error: "An active lease already exists for this property. Please end the current lease before creating a new one.",
      };
    }

    // Insert lease
    const { data: lease, error: insertError } = await supabase
      .from("rp_leases")
      .insert({
        property_id: propertyId,
        lease_type: leaseType || null,
        start_date: startDate || null,
        end_date: endDate || null,
        monthly_rent: monthlyRent,
        currency_code: currencyCode,
        security_deposit: securityDeposit,
        deposit_paid_date: depositPaidDate || null,
        utility_split_percent: utilitySplitPercent,
        internet_included: internetIncluded,
        pad_enabled: padEnabled,
        pets_allowed: petsAllowed,
        smoking_allowed: smokingAllowed,
        max_occupants: maxOccupants,
        late_fee_type: lateFeeType,
        late_fee_amount: lateFeeAmount,
        status: "active",
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Generate lease document content
    const { data: fullProperty } = await supabase
      .from("rp_properties")
      .select("address_line1, address_line2, city, province_state, postal_code, unit_description, parking_type, parking_spots, laundry_type, storage_included, yard_access, has_separate_entrance")
      .eq("id", propertyId)
      .single();

    const { data: landlordUser } = await supabase
      .from("rp_users")
      .select("first_name, last_name, email, phone")
      .eq("id", rpUser.id)
      .single();

    // Get tenants on this lease (if any assigned at creation time)
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select("user_id, rp_users!inner(first_name, last_name, email, phone, id_type, id_number, id_place_of_issue, id_expiry_date, id_name_on_document)")
      .eq("lease_id", lease.id);

    if (fullProperty && landlordUser) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenantUsers = (leaseTenants ?? []).map((lt) => lt.rp_users as any);
      const documentContent = generateAlbertaLeaseContent(
        {
          lease_type: leaseType || "fixed",
          start_date: startDate,
          end_date: endDate || null,
          monthly_rent: monthlyRent,
          currency_code: currencyCode,
          security_deposit: securityDeposit,
          deposit_paid_date: depositPaidDate || null,
          utility_split_percent: utilitySplitPercent,
          internet_included: internetIncluded,
          pad_enabled: padEnabled,
          pets_allowed: petsAllowed,
          smoking_allowed: smokingAllowed,
          max_occupants: maxOccupants,
          late_fee_type: lateFeeType,
          late_fee_amount: lateFeeAmount,
        },
        fullProperty,
        landlordUser,
        tenantUsers
      );

      await supabase
        .from("rp_leases")
        .update({ lease_document_content: documentContent })
        .eq("id", lease.id);
    }

    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${propertyId}`);
    revalidatePath("/admin/dashboard");

    // Notify tenants
    if (leaseTenants && leaseTenants.length > 0) {
      for (const tenant of leaseTenants) {
        await createNotification(supabase, {
          userId: tenant.user_id,
          title: "Lease Update",
          body: "Your lease has been created.",
          type: "lease",
          urgency: "high",
        });
      }
    }

    return { success: true, leaseId: lease.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updateLease(leaseId: string, formData: FormData) {
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

    // Verify lease belongs to landlord's property
    const { data: lease, error: leaseError } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseId)
      .single();

    if (leaseError || !lease) {
      return { success: false, error: "Lease not found" };
    }

    const landlordId = (lease.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own the property associated with this lease" };
    }

    // Build dynamic update object (only include non-empty fields)
    const updateData: Record<string, any> = {};

    const monthlyRent = formData.get("monthly_rent") as string;
    if (monthlyRent !== null && monthlyRent !== "") {
      updateData.monthly_rent = parseFloat(monthlyRent) || 0;
    }

    const securityDeposit = formData.get("security_deposit") as string;
    if (securityDeposit !== null && securityDeposit !== "") {
      updateData.security_deposit = parseFloat(securityDeposit) || 0;
    }

    const depositPaidDate = formData.get("deposit_paid_date") as string;
    if (depositPaidDate !== null) {
      updateData.deposit_paid_date = depositPaidDate || null;
    }

    const utilitySplitPercent = formData.get("utility_split_percent") as string;
    if (utilitySplitPercent !== null && utilitySplitPercent !== "") {
      updateData.utility_split_percent = parseFloat(utilitySplitPercent) || 0;
    }

    const internetIncluded = formData.get("internet_included") as string;
    if (internetIncluded !== null) {
      updateData.internet_included = internetIncluded === "true" || internetIncluded === "on";
    }

    const padEnabled = formData.get("pad_enabled") as string;
    if (padEnabled !== null) {
      updateData.pad_enabled = padEnabled === "true" || padEnabled === "on";
    }

    const petsAllowed = formData.get("pets_allowed") as string;
    if (petsAllowed !== null) {
      updateData.pets_allowed = petsAllowed === "true" || petsAllowed === "on";
    }

    const smokingAllowed = formData.get("smoking_allowed") as string;
    if (smokingAllowed !== null) {
      updateData.smoking_allowed = smokingAllowed === "true" || smokingAllowed === "on";
    }

    const maxOccupants = formData.get("max_occupants") as string;
    if (maxOccupants !== null && maxOccupants !== "") {
      updateData.max_occupants = parseFloat(maxOccupants) || 3;
    }

    const lateFeeType = formData.get("late_fee_type") as string;
    if (lateFeeType !== null && lateFeeType !== "") {
      updateData.late_fee_type = lateFeeType;
    }

    const lateFeeAmount = formData.get("late_fee_amount") as string;
    if (lateFeeAmount !== null && lateFeeAmount !== "") {
      updateData.late_fee_amount = parseFloat(lateFeeAmount) || 0;
    }

    const status = formData.get("status") as string;
    if (status !== null && status !== "") {
      updateData.status = status;
    }

    const endDate = formData.get("end_date") as string;
    if (endDate !== null) {
      updateData.end_date = endDate || null;
    }

    // Update lease
    const { error: updateError } = await supabase
      .from("rp_leases")
      .update(updateData)
      .eq("id", leaseId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${lease.property_id}`);
    revalidatePath("/admin/financials");
    revalidatePath("/admin/dashboard");

    return { success: true, propertyId: lease.property_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function renewLease(leaseId: string, formData: FormData) {
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

    // Verify lease belongs to landlord's property
    const { data: oldLease, error: leaseError } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseId)
      .single();

    if (leaseError || !oldLease) {
      return { success: false, error: "Lease not found" };
    }

    const landlordId = (oldLease.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own the property associated with this lease" };
    }

    // Extract form fields for the new lease
    const leaseType = formData.get("lease_type") as string;
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;
    const monthlyRent = parseFloat(formData.get("monthly_rent") as string) || 0;
    const currencyCode = (formData.get("currency_code") as string) || "CAD";
    const securityDeposit =
      parseFloat(formData.get("security_deposit") as string) || 0;
    const depositPaidDate = formData.get("deposit_paid_date") as string;
    const utilitySplitPercent =
      parseFloat(formData.get("utility_split_percent") as string) || 40;
    const internetIncluded =
      formData.get("internet_included") === "true" ||
      formData.get("internet_included") === "on";
    const padEnabled =
      formData.get("pad_enabled") === "true" ||
      formData.get("pad_enabled") === "on";
    const petsAllowed =
      formData.get("pets_allowed") === "true" ||
      formData.get("pets_allowed") === "on";
    const smokingAllowed =
      formData.get("smoking_allowed") === "true" ||
      formData.get("smoking_allowed") === "on";
    const maxOccupants =
      parseFloat(formData.get("max_occupants") as string) || 3;
    const lateFeeType =
      (formData.get("late_fee_type") as string) || "flat";
    const lateFeeAmount =
      parseFloat(formData.get("late_fee_amount") as string) || 50;

    if (!startDate) {
      return { success: false, error: "Start date is required" };
    }

    if (leaseType === "fixed" && !endDate) {
      return { success: false, error: "End date is required for fixed-term leases" };
    }

    if (monthlyRent <= 0) {
      return { success: false, error: "Monthly rent must be greater than 0" };
    }

    // Expire the old lease: set status to "expired" and end_date to new start date minus 1 day
    const oldEndDate = new Date(startDate);
    oldEndDate.setDate(oldEndDate.getDate() - 1);
    const oldEndDateStr = oldEndDate.toISOString().split("T")[0];

    const { error: expireError } = await supabase
      .from("rp_leases")
      .update({ status: "expired", end_date: oldEndDateStr })
      .eq("id", leaseId);

    if (expireError) {
      return { success: false, error: expireError.message };
    }

    // Create the new lease
    const { data: newLease, error: insertError } = await supabase
      .from("rp_leases")
      .insert({
        property_id: oldLease.property_id,
        lease_type: leaseType || null,
        start_date: startDate || null,
        end_date: leaseType === "fixed" ? endDate || null : null,
        monthly_rent: monthlyRent,
        currency_code: currencyCode,
        security_deposit: securityDeposit,
        deposit_paid_date: depositPaidDate || null,
        utility_split_percent: utilitySplitPercent,
        internet_included: internetIncluded,
        pad_enabled: padEnabled,
        pets_allowed: petsAllowed,
        smoking_allowed: smokingAllowed,
        max_occupants: maxOccupants,
        late_fee_type: lateFeeType,
        late_fee_amount: lateFeeAmount,
        status: "active",
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Copy lease_tenants from old lease to new lease
    const { data: oldTenants } = await supabase
      .from("rp_lease_tenants")
      .select("user_id, role, is_primary_contact")
      .eq("lease_id", leaseId);

    if (oldTenants && oldTenants.length > 0) {
      const newTenantRows = oldTenants.map((t) => ({
        lease_id: newLease.id,
        user_id: t.user_id,
        role: t.role,
        is_primary_contact: t.is_primary_contact,
      }));

      await supabase.from("rp_lease_tenants").insert(newTenantRows);
    }

    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${oldLease.property_id}`);
    revalidatePath("/admin/financials");
    revalidatePath("/admin/dashboard");

    // Notify all tenants on the renewed lease
    if (oldTenants && oldTenants.length > 0) {
      for (const tenant of oldTenants) {
        await createNotification(supabase, {
          userId: tenant.user_id,
          title: "Lease Update",
          body: "Your lease has been renewed.",
          type: "lease",
          urgency: "high",
        });
      }
    }

    return { success: true, newLeaseId: newLease.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function saveLeaseDocument(
  leaseId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentContent: any
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

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Verify ownership
    const { data: lease } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseId)
      .single();

    if (!lease) {
      return { success: false, error: "Lease not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((lease.rp_properties as any)?.landlord_id !== rpUser.id) {
      return { success: false, error: "Not authorized" };
    }

    const { error: updateError } = await supabase
      .from("rp_leases")
      .update({ lease_document_content: documentContent })
      .eq("id", leaseId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/admin/leases/${leaseId}/document`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function uploadLeaseDocument(formData: FormData) {
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

    const leaseId = formData.get("lease_id") as string;
    const file = formData.get("file") as File;

    if (!leaseId || !file) {
      return { success: false, error: "Lease ID and file are required" };
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are accepted" };
    }

    if (file.size > 20 * 1024 * 1024) {
      return { success: false, error: "File must be under 20MB" };
    }

    // Verify ownership
    const { data: lease } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseId)
      .single();

    if (!lease) {
      return { success: false, error: "Lease not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((lease.rp_properties as any)?.landlord_id !== rpUser.id) {
      return { success: false, error: "Not authorized" };
    }

    const filePath = `lease-documents/${leaseId}/${Date.now()}-custom.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    // Store reference in rp_documents
    await supabase.from("rp_documents").insert({
      property_id: lease.property_id,
      lease_id: leaseId,
      uploaded_by: rpUser.id,
      title: "Custom Lease Agreement",
      category: "lease",
      file_url: urlData.publicUrl,
      file_size: file.size,
      visible_to_tenant: true,
    });

    revalidatePath(`/admin/leases/${leaseId}/document`);
    revalidatePath(`/admin/properties/${lease.property_id}`);
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function terminateLease(leaseId: string) {
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

    // Verify lease belongs to landlord's property
    const { data: lease, error: leaseError } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseId)
      .single();

    if (leaseError || !lease) {
      return { success: false, error: "Lease not found" };
    }

    const landlordId = (lease.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own the property associated with this lease" };
    }

    // Update lease status to terminated and set end_date to today
    const today = new Date().toISOString().split("T")[0];
    const { error: updateError } = await supabase
      .from("rp_leases")
      .update({ status: "terminated", end_date: today })
      .eq("id", leaseId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${lease.property_id}`);
    revalidatePath("/admin/financials");
    revalidatePath("/admin/dashboard");

    return { success: true, propertyId: lease.property_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
