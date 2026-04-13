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

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, email, role")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser || rpUser.role !== "landlord") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // Verify tenant belongs to landlord's properties
    const { data: properties } = await supabase
      .from("rp_properties")
      .select("id")
      .eq("landlord_id", rpUser.id);

    if (!properties || properties.length === 0) {
      return NextResponse.json(
        { error: "No properties found" },
        { status: 404 }
      );
    }

    const propertyIds = properties.map((p) => p.id);
    const { data: leases } = await supabase
      .from("rp_leases")
      .select("id")
      .in("property_id", propertyIds);

    const leaseIds = (leases ?? []).map((l) => l.id);
    if (leaseIds.length === 0) {
      return NextResponse.json(
        { error: "Tenant not found on your leases" },
        { status: 404 }
      );
    }

    const { data: link } = await supabase
      .from("rp_lease_tenants")
      .select("id")
      .eq("user_id", tenantId)
      .in("lease_id", leaseIds)
      .limit(1)
      .single();

    if (!link) {
      return NextResponse.json(
        { error: "Tenant not found on your leases" },
        { status: 404 }
      );
    }

    // Get tenant info for display
    const { data: tenant } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name, email")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Fetch landlord profile + plan
    const { data: profile } = await supabase
      .from("rp_landlord_profiles")
      .select(
        "id, stripe_customer_id, plan_id, rp_plans(slug, free_id_verifications_per_month)"
      )
      .eq("user_id", rpUser.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Landlord profile not found" },
        { status: 404 }
      );
    }

    const plan = profile.rp_plans as any;
    const freePerMonth = Number(plan?.free_id_verifications_per_month ?? 0);

    // Check free quota
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: usedThisMonth } = await supabase
      .from("rp_id_verifications")
      .select("id", { count: "exact", head: true })
      .eq("landlord_id", rpUser.id)
      .eq("used_free_quota", true)
      .gte("created_at", startOfMonth.toISOString());

    const freeRemaining = freePerMonth - (usedThisMonth ?? 0);
    const isFree = freeRemaining > 0;

    if (isFree) {
      // Create Stripe Identity session directly (no payment required)
      const stripe = getStripe();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

      const verificationSession =
        await stripe.identity.verificationSessions.create({
          type: "document",
          metadata: {
            rp_user_id: tenant.id,
            landlord_id: rpUser.id,
            source: "purchased",
            used_free_quota: "true",
          },
          options: {
            document: {
              require_matching_selfie: true,
            },
          },
          return_url: `${appUrl}/tenant/profile?verification=complete`,
        });

      const expiresAt = new Date(
        Date.now() + 48 * 60 * 60 * 1000
      ).toISOString();

      // Insert audit record
      await supabase.from("rp_id_verifications").insert({
        tenant_id: tenant.id,
        landlord_id: rpUser.id,
        stripe_session_id: verificationSession.id,
        verification_url: verificationSession.url,
        status: "pending",
        used_free_quota: true,
        expires_at: expiresAt,
      });

      // Update tenant's rp_users for quick lookups
      await supabase
        .from("rp_users")
        .update({
          stripe_identity_session_id: verificationSession.id,
          stripe_identity_status: "pending",
          stripe_identity_verification_url: verificationSession.url,
          stripe_identity_expires_at: expiresAt,
          stripe_identity_purchased_by: rpUser.id,
          id_document_status: "pending",
          id_uploaded_at: new Date().toISOString(),
        })
        .eq("id", tenant.id);

      // Notify tenant
      await supabase.from("rp_notifications").insert({
        user_id: tenant.id,
        title: "ID Verification Requested",
        body: "Your landlord has requested identity verification. Please complete it from your profile page.",
        type: "general",
        link: "/tenant/profile",
      });

      // Notify landlord
      await supabase.from("rp_notifications").insert({
        user_id: rpUser.id,
        title: "Verification Sent",
        body: `ID verification has been sent to ${tenant.first_name} ${tenant.last_name}. They will be notified.`,
        type: "general",
        link: `/admin/tenants/${tenant.id}`,
      });

      return NextResponse.json({
        success: true,
        free: true,
        verificationUrl: verificationSession.url,
      });
    }

    // Paid flow — create Stripe Checkout session
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_ID_VERIFICATION_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/admin/tenants/${tenant.id}?id_verification=purchased`,
      cancel_url: `${appUrl}/admin/tenants/${tenant.id}?id_verification=cancelled`,
      metadata: {
        type: "id_verification_purchase",
        tenant_id: tenant.id,
        landlord_user_id: rpUser.id,
        landlord_profile_id: profile.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("ID verification purchase error:", error);

    // Surface Stripe permission errors clearly
    if (error?.type === "StripePermissionError" || error?.code === "account_invalid") {
      return NextResponse.json(
        { error: "Stripe Identity is not enabled on this account. Please enable it at https://dashboard.stripe.com/identity/application" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
