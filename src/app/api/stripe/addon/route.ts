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

    const { addonSlug } = await request.json();
    if (!addonSlug) {
      return NextResponse.json(
        { error: "Add-on slug is required" },
        { status: 400 }
      );
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, email")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("rp_landlord_profiles")
      .select("id, stripe_customer_id, plan_id, rp_plans(slug)")
      .eq("user_id", rpUser.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Landlord profile not found" },
        { status: 404 }
      );
    }

    // Get add-on
    const { data: addon } = await supabase
      .from("rp_plan_addons")
      .select("id, slug, name, price, setup_fee, min_plan_slug")
      .eq("slug", addonSlug)
      .eq("is_active", true)
      .single();

    if (!addon) {
      return NextResponse.json({ error: "Add-on not found" }, { status: 404 });
    }

    // Check plan gate
    const planOrder = ["free", "starter", "growth", "pro", "enterprise"];
    const currentPlan = (profile.rp_plans as any)?.slug ?? "free";
    if (planOrder.indexOf(currentPlan) < planOrder.indexOf(addon.min_plan_slug)) {
      return NextResponse.json(
        {
          error: `Requires ${addon.min_plan_slug} plan or higher`,
        },
        { status: 403 }
      );
    }

    // Check if already active
    const { data: existing } = await supabase
      .from("rp_landlord_addons")
      .select("id")
      .eq("landlord_profile_id", profile.id)
      .eq("addon_id", addon.id)
      .eq("status", "active")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Add-on already active" },
        { status: 400 }
      );
    }

    // For now, activate directly (Stripe subscription items can be added later)
    const stripe = getStripe();

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

    // Create checkout session for add-on setup fee + first month
    const totalInitial = Number(addon.price) + Number(addon.setup_fee);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `${addon.name} — First Month${Number(addon.setup_fee) > 0 ? " + Setup" : ""}`,
            },
            unit_amount: Math.round(totalInitial * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?addon=success&slug=${addon.slug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?addon=cancelled`,
      metadata: {
        landlord_profile_id: profile.id,
        addon_id: addon.id,
        addon_slug: addon.slug,
        type: "addon_purchase",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Addon purchase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
