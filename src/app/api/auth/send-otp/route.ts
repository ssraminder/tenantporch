import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/branding/logo-tenant-lightbg.png`;

export async function POST(request: Request) {
  try {
    const { email, firstName } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Store in rp_otp_codes table (upsert by email)
    const { error: dbError } = await supabase
      .from("rp_otp_codes")
      .upsert(
        { email: email.toLowerCase(), code, expires_at: expiresAt, attempts: 0 },
        { onConflict: "email" }
      );

    if (dbError) {
      console.error("OTP store error:", dbError);
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }

    // Send via Resend
    const { error: emailError } = await resend.emails.send({
      from: "TenantPorch <noreply@tenantporch.com>",
      to: email,
      subject: `${code} is your TenantPorch verification code`,
      html: `
        <div style="font-family: 'DM Sans', Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
          <img src="${EMAIL_LOGO_URL}" alt="TenantPorch" height="36" style="height:36px;width:auto;margin-bottom:24px;" />
          <h1 style="font-family: Manrope, sans-serif; color: #273f4f; font-size: 24px; margin-bottom: 8px;">
            Verify your email
          </h1>
          <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
            Hi${firstName ? ` ${firstName}` : ""},
          </p>
          <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
            Enter this code to complete your TenantPorch signup:
          </p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #273f4f;">
              ${code}
            </span>
          </div>
          <p style="color: #74777f; font-size: 13px; line-height: 1.6;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("OTP email error:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
