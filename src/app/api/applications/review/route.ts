import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { applicationId, action, reason } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: "Missing applicationId or action" },
        { status: 400 }
      );
    }

    // Fetch the application and verify ownership
    const { data: application } = await supabase
      .from("rp_tenant_applications")
      .select("id, landlord_id, property_id, status, first_name, last_name, email, phone")
      .eq("id", applicationId)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.landlord_id !== rpUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only allow actions on submitted or reviewing applications
    if (
      application.status !== "submitted" &&
      application.status !== "reviewing"
    ) {
      return NextResponse.json(
        { error: "Application cannot be modified in its current status" },
        { status: 400 }
      );
    }

    let newStatus: string;
    let notificationTitle: string;
    let notificationBody: string;

    switch (action) {
      case "approve":
        newStatus = "approved";
        notificationTitle = "Application Approved";
        notificationBody = `Application from ${application.first_name} ${application.last_name} has been approved.`;
        break;
      case "decline":
        newStatus = "declined";
        notificationTitle = "Application Declined";
        notificationBody = `Application from ${application.first_name} ${application.last_name} has been declined.`;
        break;
      case "request_info":
        newStatus = "reviewing";
        notificationTitle = "More Info Requested";
        notificationBody = `Additional information requested for ${application.first_name} ${application.last_name}'s application.`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update application status
    const updateData: Record<string, unknown> = {
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    };

    if (reason) {
      updateData.review_notes = reason;
    }

    const { error: updateError } = await supabase
      .from("rp_tenant_applications")
      .update(updateData)
      .eq("id", applicationId);

    if (updateError) {
      console.error("Application review update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    // Create notification for the landlord (activity log)
    await supabase.from("rp_notifications").insert({
      user_id: rpUser.id,
      type: "general",
      title: notificationTitle,
      body: notificationBody,
      link: `/admin/applications/${applicationId}`,
    });

    // --- Flow 1: On approval, auto-create tenant account ---
    let tenantAccountCreated = false;
    if (action === "approve" && application.email) {
      // Check if an rp_users record already exists for this email
      const { data: existingRpUser } = await adminSupabase
        .from("rp_users")
        .select("id")
        .eq("email", application.email)
        .maybeSingle();

      if (!existingRpUser) {
        const tempPassword = generateTempPassword();

        const { data: authData, error: createAuthError } =
          await adminSupabase.auth.admin.createUser({
            email: application.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              first_name: application.first_name,
              last_name: application.last_name,
              role: "tenant",
              temp_password: true,
            },
          });

        if (!createAuthError && authData?.user) {
          const { error: createUserError } = await adminSupabase
            .from("rp_users")
            .insert({
              auth_id: authData.user.id,
              first_name: application.first_name,
              last_name: application.last_name,
              email: application.email,
              phone: application.phone || null,
              role: "tenant",
              must_change_password: true,
            });

          if (createUserError) {
            await adminSupabase.auth.admin.deleteUser(authData.user.id);
            console.error("Failed to create rp_users for approved applicant:", createUserError);
          } else {
            tenantAccountCreated = true;

            // Fetch property for email context
            const { data: property } = await supabase
              .from("rp_properties")
              .select("address_line1, city")
              .eq("id", application.property_id)
              .single();

            const landlordName = `${rpUser.first_name ?? ""} ${rpUser.last_name ?? ""}`.trim() || "Your landlord";
            const propertyAddress = property
              ? `${property.address_line1}, ${property.city}`
              : "your property";

            try {
              await sendWelcomeEmail({
                to: application.email,
                firstName: application.first_name,
                landlordName,
                propertyAddress,
                tempPassword,
              });
            } catch (emailErr) {
              console.error("Failed to send welcome email for approved applicant:", emailErr);
            }
          }
        } else {
          console.error("Failed to create auth user for approved applicant:", createAuthError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      tenantAccountCreated,
    });
  } catch (err) {
    console.error("Application review error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
