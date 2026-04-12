import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// POST /api/stripe/checkout — Create a Checkout Session for tenant rent payment
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

    const body = await req.json();
    const { leaseId, amount, paymentId } = body;

    if (!leaseId || !amount) {
      return NextResponse.json(
        { error: "leaseId and amount are required" },
        { status: 400 }
      );
    }

    // Get tenant rp_user
    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify tenant is on this lease
    const { data: leaseTenant } = await supabase
      .from("rp_lease_tenants")
      .select("lease_id")
      .eq("lease_id", leaseId)
      .eq("user_id", rpUser.id)
      .single();

    if (!leaseTenant) {
      return NextResponse.json(
        { error: "You are not on this lease" },
        { status: 403 }
      );
    }

    // Get the lease → property → landlord to find Stripe Connect account
    const { data: lease } = await supabase
      .from("rp_leases")
      .select("id, property_id, monthly_rent, rp_properties(landlord_id)")
      .eq("id", leaseId)
      .single();

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const landlordId = (lease.rp_properties as any)?.landlord_id;

    const { data: landlordProfile } = await supabase
      .from("rp_landlord_profiles")
      .select(
        "stripe_connect_account_id, rp_plans(card_surcharge_percent)"
      )
      .eq("user_id", landlordId)
      .single();

    if (!landlordProfile?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: "Landlord has not connected their Stripe account. Please use e-Transfer or another payment method." },
        { status: 400 }
      );
    }

    // Calculate surcharge and platform fee
    const plan = landlordProfile.rp_plans as any;
    const surchargePercent = plan?.card_surcharge_percent ?? 2.9;
    const amountCents = Math.round(amount * 100);
    const surchargeCents = Math.round(amountCents * (surchargePercent / 100));
    const totalCents = amountCents + surchargeCents;

    // Platform fee: 1% of the base amount (TenantPorch's cut)
    const platformFeeCents = Math.round(amountCents * 0.01);

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    // Create Checkout Session with destination charge
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            unit_amount: totalCents,
            product_data: {
              name: "Rent Payment",
              description: `Rent payment for ${new Date().toLocaleDateString("en-CA", { month: "long", year: "numeric" })}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: landlordProfile.stripe_connect_account_id,
        },
      },
      metadata: {
        payment_id: paymentId || "",
        tenant_user_id: rpUser.id,
        lease_id: leaseId,
        base_amount: amount.toString(),
        surcharge_percent: surchargePercent.toString(),
      },
      customer_email: user.email ?? undefined,
      success_url: `${origin}/tenant/payments?status=success`,
      cancel_url: `${origin}/tenant/payments?status=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
