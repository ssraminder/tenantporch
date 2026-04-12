import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Create user with admin API (email pre-verified via our OTP)
    const { data: authData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: "landlord",
        },
      });

    if (createError) {
      console.error("Create user error:", createError);
      // Handle duplicate user
      if (createError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "This email is already registered." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // rp_users + rp_landlord_profiles are created by the DB trigger

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
    });
  } catch (err) {
    console.error("Complete signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
