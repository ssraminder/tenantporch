import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch stored OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("rp_otp_codes")
      .select("code, expires_at, attempts")
      .eq("email", email.toLowerCase())
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check max attempts (5)
    if (otpRecord.attempts >= 5) {
      await supabase
        .from("rp_otp_codes")
        .delete()
        .eq("email", email.toLowerCase());

      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Increment attempts
    await supabase
      .from("rp_otp_codes")
      .update({ attempts: otpRecord.attempts + 1 })
      .eq("email", email.toLowerCase());

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase
        .from("rp_otp_codes")
        .delete()
        .eq("email", email.toLowerCase());

      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check code
    if (otpRecord.code !== code) {
      return NextResponse.json(
        { error: "Invalid code. Please try again." },
        { status: 400 }
      );
    }

    // Success — delete used code
    await supabase
      .from("rp_otp_codes")
      .delete()
      .eq("email", email.toLowerCase());

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
