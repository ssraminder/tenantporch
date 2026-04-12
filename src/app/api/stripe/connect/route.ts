import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// POST /api/stripe/connect — Start Stripe Connect onboarding for landlord
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get landlord profile
    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: landlordProfile } = await supabase
      .from("rp_landlord_profiles")
      .select("id, stripe_connect_account_id, stripe_customer_id")
      .eq("user_id", rpUser.id)
      .single();

    if (!landlordProfile) {
      return NextResponse.json(
        { error: "Landlord profile not found" },
        { status: 404 }
      );
    }

    let accountId = landlordProfile.stripe_connect_account_id;

    // Create a Stripe Connect account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "CA",
        email: user.email,
        metadata: {
          landlord_profile_id: landlordProfile.id,
          rp_user_id: rpUser.id,
        },
      });

      accountId = account.id;

      // Save the account ID
      await supabase
        .from("rp_landlord_profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", landlordProfile.id);
    }

    // Create an account link for onboarding
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/admin/settings?stripe=refresh`,
      return_url: `${origin}/admin/settings?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    const message = err instanceof Error ? err.message : "Failed to create connect link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/stripe/connect — Check Stripe Connect account status
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: landlordProfile } = await supabase
      .from("rp_landlord_profiles")
      .select("stripe_connect_account_id")
      .eq("user_id", rpUser.id)
      .single();

    if (!landlordProfile?.stripe_connect_account_id) {
      return NextResponse.json({ connected: false });
    }

    const account = await stripe.accounts.retrieve(
      landlordProfile.stripe_connect_account_id
    );

    return NextResponse.json({
      connected: account.charges_enabled && account.details_submitted,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (err) {
    console.error("Stripe Connect status error:", err);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
