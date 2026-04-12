import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { planSlug } = await request.json();
    if (!planSlug) {
      return NextResponse.json(
        { error: "Plan slug is required" },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, email")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get landlord profile
    const { data: profile } = await supabase
      .from("rp_landlord_profiles")
      .select("id, stripe_customer_id, plan_id")
      .eq("user_id", rpUser.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Landlord profile not found" },
        { status: 404 }
      );
    }

    // Get target plan
    const { data: plan } = await supabase
      .from("rp_plans")
      .select("id, slug, name, stripe_price_id, base_price")
      .eq("slug", planSlug)
      .eq("is_active", true)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Free plan: just update directly
    if (plan.slug === "free") {
      await supabase
        .from("rp_landlord_profiles")
        .update({
          plan_id: plan.id,
          subscription_status: "free",
        })
        .eq("id", profile.id);

      return NextResponse.json({ success: true });
    }

    // Paid plan: create Stripe Checkout session
    const stripe = getStripe();

    // Ensure customer exists
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: rpUser.email,
        metadata: {
          rp_user_id: rpUser.id,
          landlord_profile_id: profile.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("rp_landlord_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", profile.id);
    }

    // If plan has a Stripe price ID, use subscription checkout
    if (plan.stripe_price_id) {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?upgrade=success&plan=${plan.slug}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?upgrade=cancelled`,
        metadata: {
          landlord_profile_id: profile.id,
          plan_id: plan.id,
          plan_slug: plan.slug,
          type: "plan_upgrade",
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // No Stripe price: update directly (for development/testing)
    await supabase
      .from("rp_landlord_profiles")
      .update({
        plan_id: plan.id,
        subscription_status: "active",
      })
      .eq("id", profile.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
