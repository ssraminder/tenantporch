import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Missing token or password" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Look up the invite
    const { data: invite, error: inviteError } = await adminSupabase
      .from("rp_tenant_invites")
      .select("id, email, first_name, last_name, phone, property_id, lease_id, landlord_id, role, status, expires_at")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid invitation link" },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingRpUser } = await adminSupabase
      .from("rp_users")
      .select("id")
      .eq("email", invite.email)
      .maybeSingle();

    let tenantUserId: string;

    if (existingRpUser) {
      tenantUserId = existingRpUser.id;
    } else {
      // Create auth user with the tenant's chosen password
      const { data: authData, error: createAuthError } =
        await adminSupabase.auth.admin.createUser({
          email: invite.email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: invite.first_name,
            last_name: invite.last_name,
            role: "tenant",
          },
        });

      if (createAuthError) {
        return NextResponse.json(
          { error: `Failed to create account: ${createAuthError.message}` },
          { status: 500 }
        );
      }

      // Create rp_users record (no must_change_password since they set their own)
      const { data: newRpUser, error: createUserError } = await adminSupabase
        .from("rp_users")
        .insert({
          auth_id: authData.user.id,
          first_name: invite.first_name,
          last_name: invite.last_name,
          email: invite.email,
          phone: invite.phone || null,
          role: "tenant",
          must_change_password: false,
        })
        .select("id")
        .single();

      if (createUserError) {
        await adminSupabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }

      tenantUserId = newRpUser.id;
    }

    // Link tenant to lease
    const { error: leaseTenantError } = await adminSupabase
      .from("rp_lease_tenants")
      .insert({
        user_id: tenantUserId,
        lease_id: invite.lease_id,
        role: invite.role || "tenant",
      });

    if (leaseTenantError) {
      console.error("Failed to link tenant to lease:", leaseTenantError);
      // Don't fail entirely — account was created
    }

    // Mark invite as accepted
    await adminSupabase
      .from("rp_tenant_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    // Create welcome notification
    await adminSupabase.from("rp_notifications").insert({
      user_id: tenantUserId,
      type: "general",
      title: "Welcome to TenantPorch",
      body: "Your tenant portal is ready. Explore your dashboard to view your lease, payments, and more.",
      link: "/tenant/dashboard",
    });

    // Notify landlord
    await adminSupabase.from("rp_notifications").insert({
      user_id: invite.landlord_id,
      type: "general",
      title: "Invitation Accepted",
      body: `${invite.first_name} ${invite.last_name} has accepted your invitation and joined the tenant portal.`,
      link: "/admin/tenants",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Invite accept error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
