"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendInviteEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

function generateTempPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const symbols = "!@#$%";
  let password = "Tp";
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  password += symbols[Math.floor(Math.random() * symbols.length)];
  password += chars[Math.floor(Math.random() * chars.length)];
  return password;
}

export async function inviteTenant(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  propertyId: string;
  leaseId: string;
  role: string;
}) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Look up landlord rp_users record
    const { data: rpUser, error: rpUserError } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Verify landlord owns the property
    const { data: property, error: propertyError } = await supabase
      .from("rp_properties")
      .select("id, landlord_id, address_line1, city")
      .eq("id", data.propertyId)
      .single();

    if (propertyError || !property) {
      return { success: false, error: "Property not found" };
    }

    if (property.landlord_id !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    // Verify landlord owns the lease
    const { data: lease, error: leaseError } = await supabase
      .from("rp_leases")
      .select("id, property_id")
      .eq("id", data.leaseId)
      .single();

    if (leaseError || !lease) {
      return { success: false, error: "Lease not found" };
    }

    if (lease.property_id !== data.propertyId) {
      return { success: false, error: "Lease does not belong to this property" };
    }

    // Check if an rp_users record already exists for this email
    const { data: existingRpUser } = await adminSupabase
      .from("rp_users")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    let tenantUserId: string;

    if (existingRpUser) {
      // User already exists — just link to lease
      tenantUserId = existingRpUser.id;
    } else {
      // Generate temporary password
      const tempPassword = generateTempPassword();

      // Create auth user via Admin API
      const { data: authData, error: createAuthError } =
        await adminSupabase.auth.admin.createUser({
          email: data.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: "tenant",
            temp_password: true,
          },
        });

      if (createAuthError) {
        return { success: false, error: `Failed to create account: ${createAuthError.message}` };
      }

      // Create rp_users record
      const { data: newRpUser, error: createUserError } = await adminSupabase
        .from("rp_users")
        .insert({
          auth_id: authData.user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null,
          role: "tenant",
          must_change_password: true,
        })
        .select("id")
        .single();

      if (createUserError) {
        // Clean up auth user if rp_users insert fails
        await adminSupabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: `Failed to create user record: ${createUserError.message}` };
      }

      tenantUserId = newRpUser.id;

      // Send welcome email with credentials
      const landlordName = `${rpUser.first_name ?? ""} ${rpUser.last_name ?? ""}`.trim() || "Your landlord";
      const propertyAddress = `${property.address_line1}, ${property.city}`;

      try {
        await sendWelcomeEmail({
          to: data.email,
          firstName: data.firstName,
          landlordName,
          propertyAddress,
          tempPassword,
        });
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
        // Don't fail the whole operation if email fails
      }

      // Create welcome notification
      await adminSupabase.from("rp_notifications").insert({
        user_id: tenantUserId,
        type: "general",
        title: "Welcome to TenantPorch",
        body: `Your landlord ${landlordName} has set up your tenant portal for ${propertyAddress}. Please change your password after logging in.`,
        link: "/tenant/dashboard",
      });
    }

    // Insert into rp_lease_tenants
    const { error: leaseTenantError } = await adminSupabase
      .from("rp_lease_tenants")
      .insert({
        user_id: tenantUserId,
        lease_id: data.leaseId,
        role: data.role || "tenant",
      });

    if (leaseTenantError) {
      return { success: false, error: `Failed to link tenant to lease: ${leaseTenantError.message}` };
    }

    revalidatePath("/admin/tenants");
    revalidatePath(`/admin/properties/${data.propertyId}`);
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      tenantUserId,
      inviteStatus: existingRpUser ? "existing_user_linked" : "account_created",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function sendTenantInvite(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  propertyId: string;
  leaseId: string;
  role: string;
}) {
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
      .select("id, first_name, last_name")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Verify landlord owns the property
    const { data: property, error: propertyError } = await supabase
      .from("rp_properties")
      .select("id, landlord_id, address_line1, city")
      .eq("id", data.propertyId)
      .single();

    if (propertyError || !property) {
      return { success: false, error: "Property not found" };
    }

    if (property.landlord_id !== rpUser.id) {
      return { success: false, error: "You do not own this property" };
    }

    // Verify lease belongs to property
    const { data: lease, error: leaseError } = await supabase
      .from("rp_leases")
      .select("id, property_id")
      .eq("id", data.leaseId)
      .single();

    if (leaseError || !lease) {
      return { success: false, error: "Lease not found" };
    }

    if (lease.property_id !== data.propertyId) {
      return { success: false, error: "Lease does not belong to this property" };
    }

    // Check if already has a pending invite
    const { data: existingInvite } = await supabase
      .from("rp_tenant_invites")
      .select("id")
      .eq("email", data.email)
      .eq("lease_id", data.leaseId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return { success: false, error: "An invite has already been sent to this email for this lease." };
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from("rp_tenant_invites")
      .insert({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        property_id: data.propertyId,
        lease_id: data.leaseId,
        landlord_id: rpUser.id,
        role: data.role || "tenant",
      })
      .select("token")
      .single();

    if (inviteError || !invite) {
      return { success: false, error: "Failed to create invitation" };
    }

    // Send invite email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.com";
    const inviteUrl = `${appUrl}/join/${invite.token}`;
    const landlordName = `${rpUser.first_name ?? ""} ${rpUser.last_name ?? ""}`.trim() || "Your landlord";
    const propertyAddress = `${property.address_line1}, ${property.city}`;

    try {
      await sendInviteEmail({
        to: data.email,
        firstName: data.firstName,
        landlordName,
        propertyAddress,
        inviteUrl,
      });
    } catch (emailErr) {
      console.error("Failed to send invite email:", emailErr);
    }

    revalidatePath("/admin/tenants");

    return { success: true, inviteStatus: "invite_sent" as const };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
