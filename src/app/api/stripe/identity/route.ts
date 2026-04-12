import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name, email")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const returnUrl = body.returnUrl || `${req.nextUrl.origin}/tenant/profile`;

    // Create Stripe Identity Verification Session
    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: {
          rp_user_id: rpUser.id,
        },
        options: {
          document: {
            require_matching_selfie: true,
          },
        },
        return_url: returnUrl,
      });

    // Update user's ID status to pending
    await supabase
      .from("rp_users")
      .update({
        id_document_status: "pending",
        id_uploaded_at: new Date().toISOString(),
      })
      .eq("id", rpUser.id);

    return NextResponse.json({
      url: verificationSession.url,
      sessionId: verificationSession.id,
    });
  } catch (err) {
    console.error("Stripe Identity session error:", err);
    return NextResponse.json(
      { error: "Failed to create verification session" },
      { status: 500 }
    );
  }
}
