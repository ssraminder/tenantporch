import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Use service role for webhook processing (no user context)
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  try {
    switch (event.type) {
      // ─── Checkout completed — tenant paid rent ───
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentId = session.metadata?.payment_id;
        const tenantUserId = session.metadata?.tenant_user_id;

        if (paymentId) {
          // Update payment status to confirmed
          await supabase
            .from("rp_payments")
            .update({
              status: "confirmed",
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("id", paymentId);

          // Update rent schedule entry if applicable
          const { data: payment } = await supabase
            .from("rp_payments")
            .select("lease_id, amount, payment_for_month")
            .eq("id", paymentId)
            .single();

          if (payment?.payment_for_month) {
            await supabase
              .from("rp_rent_schedule")
              .update({
                amount_paid: payment.amount,
                status: "paid",
              })
              .eq("lease_id", payment.lease_id)
              .eq("due_date", payment.payment_for_month);
          }

          // Notify the tenant
          if (tenantUserId) {
            await supabase.from("rp_notifications").insert({
              user_id: tenantUserId,
              title: "Payment Confirmed",
              body: `Your payment of $${(session.amount_total! / 100).toFixed(2)} has been processed successfully.`,
              type: "payment",
              urgency: "normal",
            });
          }
        }
        break;
      }

      // ─── Payment failed ───
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const obj = event.data.object as any;
        const paymentId = obj.metadata?.payment_id;

        if (paymentId) {
          await supabase
            .from("rp_payments")
            .update({ status: "failed" })
            .eq("id", paymentId);
        }
        break;
      }

      // ─── Stripe Connect: account updated ───
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.details_submitted) {
          // Mark the landlord's Stripe Connect as fully onboarded
          await supabase
            .from("rp_landlord_profiles")
            .update({ stripe_connect_account_id: account.id })
            .eq("stripe_connect_account_id", account.id);
        }
        break;
      }

      // ─── Subscription events (for landlord billing) ───
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const updateData: Record<string, any> = {
          subscription_status: subscription.status === "active" ? "active" : subscription.status,
        };
        if ((subscription as any).current_period_start) {
          updateData.current_period_start = new Date((subscription as any).current_period_start * 1000).toISOString();
        }
        if ((subscription as any).current_period_end) {
          updateData.current_period_end = new Date((subscription as any).current_period_end * 1000).toISOString();
        }

        await supabase
          .from("rp_landlord_profiles")
          .update(updateData)
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("rp_landlord_profiles")
          .update({ subscription_status: "cancelled" })
          .eq("stripe_customer_id", customerId);
        break;
      }

      // ─── Invoice paid (subscription renewal) ───
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (invoice.billing_reason === "subscription_cycle") {
          await supabase
            .from("rp_landlord_profiles")
            .update({ subscription_status: "active" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      // ─── Stripe Identity: verification verified ───
      case "identity.verification_session.verified": {
        const session = event.data.object as any;
        const rpUserId = session.metadata?.rp_user_id;

        if (rpUserId) {
          // Extract verified data from the session
          const verifiedDoc = session.last_verification_report;

          const updateData: Record<string, any> = {
            id_document_status: "approved",
            id_reviewed_at: new Date().toISOString(),
          };

          // If Stripe returned document details, store them
          if (session.verified_outputs?.first_name) {
            updateData.id_name_on_document = `${session.verified_outputs.first_name} ${session.verified_outputs.last_name ?? ""}`.trim();
          }
          if (session.verified_outputs?.id_number) {
            updateData.id_number = session.verified_outputs.id_number;
          }
          if (session.verified_outputs?.document?.type) {
            const docTypeMap: Record<string, string> = {
              driving_license: "drivers_license",
              passport: "passport",
              id_card: "provincial_id",
            };
            updateData.id_type =
              docTypeMap[session.verified_outputs.document.type] ??
              session.verified_outputs.document.type;
          }
          if (session.verified_outputs?.document?.expiration_date) {
            const exp = session.verified_outputs.document.expiration_date;
            updateData.id_expiry_date = `${exp.year}-${String(exp.month).padStart(2, "0")}-${String(exp.day).padStart(2, "0")}`;
          }
          if (session.verified_outputs?.document?.issuing_country) {
            updateData.id_place_of_issue =
              session.verified_outputs.document.issuing_country;
          }

          await supabase
            .from("rp_users")
            .update(updateData)
            .eq("id", rpUserId);

          // Notify the tenant
          await supabase.from("rp_notifications").insert({
            user_id: rpUserId,
            title: "ID Verified",
            body: "Your identity has been verified successfully.",
            type: "general",
          });

          // Notify landlords who have this tenant
          const { data: leaseTenants } = await supabase
            .from("rp_lease_tenants")
            .select("rp_leases!inner(property_id, rp_properties!inner(landlord_id))")
            .eq("user_id", rpUserId);

          const landlordIds = Array.from(new Set(
            (leaseTenants ?? []).map(
              (lt: any) => lt.rp_leases?.rp_properties?.landlord_id
            ).filter(Boolean)
          ));

          for (const landlordId of landlordIds) {
            await supabase.from("rp_notifications").insert({
              user_id: landlordId,
              title: "Tenant ID Verified",
              body: `A tenant's identity has been verified via Stripe Identity.`,
              type: "general",
              link: `/admin/tenants/${rpUserId}`,
            });
          }
        }
        break;
      }

      // ─── Stripe Identity: verification requires input / failed ───
      case "identity.verification_session.requires_input": {
        const session = event.data.object as any;
        const rpUserId = session.metadata?.rp_user_id;

        if (rpUserId) {
          const lastError = session.last_error;
          const reason = lastError?.code ?? "verification_failed";

          await supabase
            .from("rp_users")
            .update({
              id_document_status: "rejected",
              id_reviewed_at: new Date().toISOString(),
            })
            .eq("id", rpUserId);

          await supabase.from("rp_notifications").insert({
            user_id: rpUserId,
            title: "ID Verification Failed",
            body: `Your identity verification could not be completed. Reason: ${reason}. Please try again.`,
            type: "general",
            link: "/tenant/profile",
          });
        }
        break;
      }

      default:
        // Unhandled event type — log but don't error
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error: ${err}`);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
